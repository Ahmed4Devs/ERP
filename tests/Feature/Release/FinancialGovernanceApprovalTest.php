<?php

use App\Models\User;
use App\Modules\Governance\Models\ApprovalAction;
use App\Modules\Governance\Models\ApprovalRequest;
use App\Modules\Governance\Models\ApprovalRule;
use App\Modules\Governance\Services\ApprovalEngineService;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
    $this->tenant = Tenant::where('slug', 'al-amal')->first();
    $this->company = Company::where('tenant_id', $this->tenant->id)->first();
    app(CurrentTenant::class)->set($this->tenant);
    app(CurrentCompany::class)->set($this->company);

    $this->user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $this->cfoUser = User::firstOrCreate(
        ['email' => 'cfo@alamal.com'],
        [
            'name' => 'Chief Financial Officer',
            'password' => bcrypt('password'),
        ]
    );

    $this->engine = app(ApprovalEngineService::class);
});

test('rule creation and tiered multi-level approval evaluation based on financial thresholds', function () {
    // 1. Create a 2-tier approval rule for vendor payments over 50,000 SAR
    $rule = $this->engine->createRuleWithLevels([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'module' => 'vendor_payment',
        'name' => 'سندات صرف كبرى فوق 50 ألف',
        'min_amount' => 50000,
        'max_amount' => null,
        'is_active' => true,
    ], [
        ['level_name' => 'اعتماد المدير المالي', 'approver_role' => 'finance_manager'],
        ['level_name' => 'اعتماد الرئيس التنفيذي CFO', 'approver_user_id' => $this->cfoUser->id],
    ]);

    expect($rule)->toBeInstanceOf(ApprovalRule::class)
        ->and($rule->required_levels)->toBe(2)
        ->and($rule->levels)->toHaveCount(2);

    // 2. Submit a high-value payment (75,000 SAR) -> must trigger the 2-tier rule
    $docId = (string) Str::uuid();
    $request = $this->engine->submitForApproval([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'document_type' => 'vendor_payment',
        'document_id' => $docId,
        'document_number' => 'VPAY-2026-HIGH-01',
        'amount' => 75000,
        'currency' => 'SAR',
        'requester_id' => $this->user->id,
        'notes' => 'Heavy equipment procurement payment',
    ]);

    expect($request)->toBeInstanceOf(ApprovalRequest::class)
        ->and($request->rule_id)->toBe($rule->id)
        ->and($request->current_level)->toBe(1)
        ->and($request->total_levels)->toBe(2)
        ->and($request->status)->toBe('pending');

    // 3. Level 1 Approval (Finance Manager)
    $approvedL1 = $this->engine->approve($request->id, $this->user->id, 'Level 1 verified and approved');
    expect($approvedL1->current_level)->toBe(2)
        ->and($approvedL1->status)->toBe('pending')
        ->and($approvedL1->approved_at)->toBeNull();

    // Verify audit action logged for Level 1
    $actionL1 = ApprovalAction::where('approval_request_id', $request->id)->where('level_number', 1)->first();
    expect($actionL1)->not->toBeNull()
        ->and($actionL1->action)->toBe('approved')
        ->and($actionL1->comments)->toBe('Level 1 verified and approved');

    // 4. Level 2 Approval (CFO) -> Completes approval chain
    $approvedL2 = $this->engine->approve($request->id, $this->cfoUser->id, 'Final authorization granted');
    expect($approvedL2->current_level)->toBe(2)
        ->and($approvedL2->status)->toBe('approved')
        ->and($approvedL2->approved_at)->not->toBeNull();

    // Verify audit action logged for Level 2
    $actionL2 = ApprovalAction::where('approval_request_id', $request->id)->where('level_number', 2)->first();
    expect($actionL2)->not->toBeNull()
        ->and($actionL2->action)->toBe('approved');
});

test('rejection at any approval level terminates workflow and logs rejection reason', function () {
    $rule = $this->engine->createRuleWithLevels([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'module' => 'journal_entry',
        'name' => 'تسويات قيود كبرى',
        'min_amount' => 20000,
        'is_active' => true,
    ], [
        ['level_name' => 'المستوى الأول', 'approver_role' => 'chief_accountant'],
        ['level_name' => 'المستوى الثاني', 'approver_role' => 'finance_director'],
    ]);

    $request = $this->engine->submitForApproval([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'document_type' => 'journal_entry',
        'document_id' => (string) Str::uuid(),
        'document_number' => 'JV-2026-REJECT-01',
        'amount' => 35000,
        'currency' => 'SAR',
        'requester_id' => $this->user->id,
    ]);

    expect($request->status)->toBe('pending');

    // Reject at Level 1
    $rejected = $this->engine->reject($request->id, $this->user->id, 'Supporting invoice documents are missing');
    expect($rejected->status)->toBe('rejected')
        ->and($rejected->rejected_at)->not->toBeNull();

    // Verify rejection audit log
    $action = ApprovalAction::where('approval_request_id', $request->id)->first();
    expect($action)->not->toBeNull()
        ->and($action->action)->toBe('rejected')
        ->and($action->comments)->toBe('Supporting invoice documents are missing');
});

test('HTTP endpoints for governance approvals, action triggers, and DOA rules return valid responses', function () {
    // 1. Create a DOA rule via HTTP
    $ruleResponse = $this->actingAs($this->user)->post(route('governance.rules.store'), [
        'module' => 'vendor_bill',
        'name' => 'فواتير مشتريات تفوق 100 ألف',
        'min_amount' => 100000,
        'max_amount' => 500000,
        'description' => 'قاعدة لحوكمة المشتريات الرأسمالية',
        'levels' => [
            ['level_name' => 'تدقيق إدارة الحسابات', 'approver_role' => 'accountant'],
            ['level_name' => 'موافقة رئيس القطاع المالي', 'approver_role' => 'cfo'],
        ],
    ]);

    $ruleResponse->assertRedirect(route('governance.rules.index'));

    $createdRule = ApprovalRule::where('name', 'فواتير مشتريات تفوق 100 ألف')->firstOrFail();
    expect($createdRule->required_levels)->toBe(2);

    // 2. View DOA rules page
    $this->actingAs($this->user)
        ->get(route('governance.rules.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Governance/Rules/Index')
            ->has('rules')
            ->has('users')
        );

    // 3. Create request and view Approvals Dashboard
    $request = $this->engine->submitForApproval([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'document_type' => 'vendor_bill',
        'document_id' => (string) Str::uuid(),
        'document_number' => 'BILL-HTTP-TEST-01',
        'amount' => 150000,
        'requester_id' => $this->user->id,
    ]);

    $this->actingAs($this->user)
        ->get(route('governance.approvals.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Governance/Approvals/Index')
            ->has('requests')
            ->has('metrics')
        );

    // 4. View Approval Request Show
    $this->actingAs($this->user)
        ->get(route('governance.approvals.show', $request->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Governance/Approvals/Show')
            ->where('approvalRequest.document_number', 'BILL-HTTP-TEST-01')
        );

    // 5. Approve Level 1 via HTTP
    $this->actingAs($this->user)
        ->post(route('governance.approvals.approve', $request->id), [
            'comments' => 'Approved via HTTP test',
        ])
        ->assertRedirect();

    $request->refresh();
    expect($request->current_level)->toBe(2);

    // 6. Reject Level 2 via HTTP
    $this->actingAs($this->user)
        ->post(route('governance.approvals.reject', $request->id), [
            'reason' => 'Budget variance detected',
        ])
        ->assertRedirect();

    $request->refresh();
    expect($request->status)->toBe('rejected');
});
