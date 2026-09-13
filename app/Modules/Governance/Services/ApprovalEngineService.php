<?php

namespace App\Modules\Governance\Services;

use App\Modules\Governance\Models\ApprovalAction;
use App\Modules\Governance\Models\ApprovalRequest;
use App\Modules\Governance\Models\ApprovalRule;
use App\Modules\Governance\Models\ApprovalRuleLevel;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ApprovalEngineService
{
    /**
     * Find matching approval rule for a transaction amount.
     */
    public function findApplicableRule(string $companyId, string $module, float $amount): ?ApprovalRule
    {
        return ApprovalRule::where('company_id', $companyId)
            ->where('module', $module)
            ->where('is_active', true)
            ->where('min_amount', '<=', $amount)
            ->where(function ($q) use ($amount): void {
                $q->whereNull('max_amount')
                    ->orWhere('max_amount', '>=', $amount);
            })
            ->with('levels')
            ->orderByDesc('min_amount')
            ->first();
    }

    /**
     * Submit a financial document for multi-level approval.
     */
    public function submitForApproval(array $data): ApprovalRequest
    {
        return DB::transaction(function () use ($data) {
            $amount = (float) ($data['amount'] ?? 0);
            $rule = $this->findApplicableRule($data['company_id'], $data['document_type'], $amount);

            $totalLevels = $rule ? max(1, $rule->required_levels) : 1;

            return ApprovalRequest::create([
                'tenant_id' => $data['tenant_id'],
                'company_id' => $data['company_id'],
                'rule_id' => $rule?->id,
                'document_type' => $data['document_type'],
                'document_id' => $data['document_id'],
                'document_number' => $data['document_number'],
                'amount' => $amount,
                'currency' => $data['currency'] ?? 'SAR',
                'requester_id' => $data['requester_id'],
                'current_level' => 1,
                'total_levels' => $totalLevels,
                'status' => 'pending',
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }

    /**
     * Approve the current level of an approval request.
     */
    public function approve(string $requestId, int $actorId, ?string $comments = null): ApprovalRequest
    {
        return DB::transaction(function () use ($requestId, $actorId, $comments) {
            /** @var ApprovalRequest $request */
            $request = ApprovalRequest::lockForUpdate()->with('rule.levels')->findOrFail($requestId);

            if ($request->status !== 'pending') {
                throw new InvalidArgumentException("Approval request #{$request->document_number} is not pending (status: {$request->status})");
            }

            // Record action
            ApprovalAction::create([
                'tenant_id' => $request->tenant_id,
                'approval_request_id' => $request->id,
                'level_number' => $request->current_level,
                'action' => 'approved',
                'actor_id' => $actorId,
                'comments' => $comments,
                'action_at' => now(),
            ]);

            // Check if there are further approval levels
            if ($request->current_level < $request->total_levels) {
                $request->current_level += 1;
                $request->save();
            } else {
                $request->status = 'approved';
                $request->approved_at = now();
                $request->save();
            }

            return $request;
        });
    }

    /**
     * Reject the approval request.
     */
    public function reject(string $requestId, int $actorId, string $rejectionReason): ApprovalRequest
    {
        return DB::transaction(function () use ($requestId, $actorId, $rejectionReason) {
            /** @var ApprovalRequest $request */
            $request = ApprovalRequest::lockForUpdate()->findOrFail($requestId);

            if ($request->status !== 'pending') {
                throw new InvalidArgumentException("Approval request #{$request->document_number} is not pending (status: {$request->status})");
            }

            ApprovalAction::create([
                'tenant_id' => $request->tenant_id,
                'approval_request_id' => $request->id,
                'level_number' => $request->current_level,
                'action' => 'rejected',
                'actor_id' => $actorId,
                'comments' => $rejectionReason,
                'action_at' => now(),
            ]);

            $request->status = 'rejected';
            $request->rejected_at = now();
            $request->save();

            return $request;
        });
    }

    /**
     * Create or update a rule with its multi-level tiers.
     */
    public function createRuleWithLevels(array $ruleData, array $levels): ApprovalRule
    {
        return DB::transaction(function () use ($ruleData, $levels) {
            $rule = ApprovalRule::create([
                'tenant_id' => $ruleData['tenant_id'],
                'company_id' => $ruleData['company_id'],
                'module' => $ruleData['module'],
                'name' => $ruleData['name'],
                'min_amount' => $ruleData['min_amount'] ?? 0,
                'max_amount' => $ruleData['max_amount'] ?? null,
                'required_levels' => count($levels),
                'is_active' => $ruleData['is_active'] ?? true,
                'description' => $ruleData['description'] ?? null,
            ]);

            foreach ($levels as $idx => $lvl) {
                ApprovalRuleLevel::create([
                    'rule_id' => $rule->id,
                    'level_number' => $idx + 1,
                    'level_name' => $lvl['level_name'] ?? 'المستوى '.($idx + 1),
                    'approver_role' => $lvl['approver_role'] ?? 'finance_manager',
                    'approver_user_id' => $lvl['approver_user_id'] ?? null,
                ]);
            }

            return $rule->load('levels');
        });
    }
}
