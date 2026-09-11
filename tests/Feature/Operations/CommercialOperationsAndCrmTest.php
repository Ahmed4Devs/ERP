<?php

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Contracts\Models\Contract;
use App\Modules\Contracts\Services\GenerateContractBillingInvoiceAction;
use App\Modules\CRM\Models\Lead;
use App\Modules\CRM\Services\ConvertLeadAction;
use App\Modules\HR\Models\Employee;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\ProjectTask;
use App\Modules\Projects\Models\ProjectTimesheet;
use App\Modules\Projects\Queries\ProjectProfitabilityQuery;
use App\Modules\Sales\Models\SalesOrder;
use App\Modules\Sales\Models\SalesQuotation;
use App\Modules\Sales\Services\ConvertQuotationToOrderAction;
use App\Modules\Support\Models\SupportTicket;
use App\Modules\Support\Services\ResolveTicketAction;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
});

test('crm lead is created and converted to customer and draft sales quotation', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $lead = Lead::create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'lead_number' => 'LD-TEST-001',
        'title' => 'Digital Transformation Advisory',
        'contact_name' => 'Tariq Al-Amoudi',
        'email' => 'tariq@alamoudi.sa',
        'phone' => '+966551122334',
        'company_name' => 'Al-Amoudi Commercial',
        'source' => 'referral',
        'status' => 'qualified',
        'estimated_value' => '40000.000000',
        'probability_percent' => 80,
        'assigned_user_id' => $userA->id,
    ]);

    expect($lead->status)->toBe('qualified')
        ->and($lead->party_id)->toBeNull();

    $action = app(ConvertLeadAction::class);
    $result = $action->execute($lead);

    $lead->refresh();
    expect($lead->status)->toBe('won')
        ->and($lead->probability_percent)->toBe(100)
        ->and($lead->converted_at)->not->toBeNull()
        ->and($lead->party_id)->not->toBeNull();

    $party = Party::find($lead->party_id);
    expect($party)->not->toBeNull()
        ->and($party->name)->toBe('Al-Amoudi Commercial')
        ->and($party->type)->toBe('customer');

    expect($result['quotation'])->not->toBeNull();
    $quotation = $result['quotation'];
    expect($quotation->subtotal)->toBe('40000.000000')
        ->and($quotation->tax_rate)->toBe('0.100000')
        ->and($quotation->tax_amount)->toBe('4000.000000')
        ->and($quotation->total_amount)->toBe('44000.000000')
        ->and($quotation->customer_id)->toBe($party->id);
});

test('sales quotation is created and converted to confirmed sales order', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $party = Party::where('tenant_id', $tenantA->id)->where('type', 'customer')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $quote = SalesQuotation::create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'quote_number' => 'QT-TEST-100',
        'customer_id' => $party->id,
        'issue_date' => '2026-09-01',
        'valid_until' => '2026-09-30',
        'subtotal' => '20000.000000',
        'tax_rate' => '0.100000',
        'tax_amount' => '2000.000000',
        'discount_amount' => '0.000000',
        'total_amount' => '22000.000000',
        'status' => 'accepted',
    ]);

    $quote->lines()->create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'description' => 'Security Audit & Compliance Report',
        'quantity' => '1.000000',
        'unit_price' => '20000.000000',
        'discount_amount' => '0.000000',
        'tax_amount' => '2000.000000',
        'line_total' => '22000.000000',
    ]);

    $action = app(ConvertQuotationToOrderAction::class);
    $salesOrder = $action->execute($quote, '2026-10-15');

    expect($salesOrder)->toBeInstanceOf(SalesOrder::class)
        ->and($salesOrder->status)->toBe('confirmed')
        ->and($salesOrder->invoicing_status)->toBe('unbilled')
        ->and($salesOrder->total_amount)->toBe('22000.000000')
        ->and($salesOrder->delivery_date->toDateString())->toBe('2026-10-15')
        ->and($salesOrder->lines)->toHaveCount(1);

    $quote->refresh();
    expect($quote->status)->toBe('converted');
});

test('project profitability query computes direct labor cost, billable revenue, and margins accurately', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $party = Party::where('tenant_id', $tenantA->id)->where('type', 'customer')->firstOrFail();
    $emp = Employee::where('company_id', $companyA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    // Employee basic salary = 12,000 SAR => hourly rate = 12000 / 240 = 50.000000 SAR/hr
    $expectedHourlyRate = bcdiv((string) $emp->basic_salary, '240', 6);
    expect($expectedHourlyRate)->toBe('50.000000');

    $project = Project::create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'project_number' => 'PRJ-TEST-001',
        'name' => 'Fintech Microservices Build',
        'customer_id' => $party->id,
        'manager_id' => $emp->id,
        'start_date' => '2026-09-01',
        'end_date' => '2026-11-30',
        'budget_cost' => '10000.000000',
        'budget_revenue' => '30000.000000',
        'status' => 'in_progress',
    ]);

    $task = ProjectTask::create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'project_id' => $project->id,
        'title' => 'API Integration Phase',
        'estimated_hours' => 100,
        'actual_hours' => 40,
        'status' => 'in_progress',
    ]);

    // Timesheet 1: 40 hours billable at 250 SAR/hr
    // Total labor cost: 40 * 50 = 2,000 SAR
    // Total billable: 40 * 250 = 10,000 SAR
    ProjectTimesheet::create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'project_id' => $project->id,
        'task_id' => $task->id,
        'employee_id' => $emp->id,
        'date' => '2026-09-08',
        'hours' => '40.00',
        'hourly_cost' => $expectedHourlyRate,
        'hourly_billing_rate' => '250.000000',
        'total_cost' => bcmul($expectedHourlyRate, '40.00', 6),
        'total_billable' => bcmul('250.000000', '40.00', 6),
        'is_billable' => true,
        'is_billed' => false,
    ]);

    $query = app(ProjectProfitabilityQuery::class);
    $metrics = $query->execute($project);

    expect($metrics['actual_labor_cost'])->toBe('2000.000000')
        ->and($metrics['actual_billable_revenue'])->toBe('10000.000000')
        ->and($metrics['actual_margin'])->toBe('8000.000000')
        ->and($metrics['actual_margin_percent'])->toBe('80.00')
        ->and($metrics['total_hours'])->toBe('40.00')
        ->and($metrics['billable_hours'])->toBe('40.00')
        ->and($metrics['cost_variance'])->toBe('8000.000000'); // 10,000 budget - 2,000 actual
});

test('recurring contract generates official service invoice and advances next billing date', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $party = Party::where('tenant_id', $tenantA->id)->where('type', 'customer')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $contract = Contract::create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'contract_number' => 'CNT-TEST-001',
        'customer_id' => $party->id,
        'title' => 'Managed DevOps Support',
        'start_date' => '2026-09-01',
        'end_date' => '2027-08-31',
        'billing_cycle' => 'monthly',
        'recurring_amount' => '8000.000000',
        'tax_rate' => '0.100000',
        'next_billing_date' => '2026-09-01',
        'status' => 'active',
        'auto_renew' => true,
    ]);

    $contract->lines()->create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'description' => '24/7 Monitoring & DevOps Retainer',
        'quantity' => '1.000000',
        'unit_price' => '8000.000000',
        'line_total' => '8000.000000',
    ]);

    $action = app(GenerateContractBillingInvoiceAction::class);
    $invoice = $action->execute($contract, '2026-09-01');

    expect($invoice)->toBeInstanceOf(ServiceInvoice::class)
        ->and($invoice->status)->toBe('posted')
        ->and($invoice->subtotal)->toBe('8000.000000')
        ->and($invoice->tax_amount)->toBe('800.000000') // 10% test tax
        ->and($invoice->total)->toBe('8800.000000')
        ->and($invoice->journal_entry_id)->not->toBeNull();

    // Verify General Ledger postings
    $journal = JournalEntry::with('lines.account')->findOrFail($invoice->journal_entry_id);
    expect($journal->isBalanced())->toBeTrue();

    // Debit AR Control (1200) for 8800
    $arLine = $journal->lines->first(fn ($l) => $l->account->code === '1200');
    expect($arLine)->not->toBeNull()
        ->and($arLine->debit)->toBe('8800.000000');

    // Credit Revenue (4100) for 8000
    $revLine = $journal->lines->first(fn ($l) => $l->account->code === '4100');
    expect($revLine)->not->toBeNull()
        ->and($revLine->credit)->toBe('8000.000000');

    // Credit Tax Liability (2150) for 800
    $taxLine = $journal->lines->first(fn ($l) => $l->account->code === '2150');
    expect($taxLine)->not->toBeNull()
        ->and($taxLine->credit)->toBe('800.000000');

    // Verify Contract was advanced to next month
    $contract->refresh();
    expect($contract->last_billed_at->toDateString())->toBe('2026-09-01')
        ->and($contract->next_billing_date->toDateString())->toBe('2026-10-01');
});

test('support ticket lifecycle manages responses and resolution', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $party = Party::where('tenant_id', $tenantA->id)->where('type', 'customer')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $ticket = SupportTicket::create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'ticket_number' => 'TCK-TEST-001',
        'customer_id' => $party->id,
        'contact_name' => 'Bassem Al-Harbi',
        'contact_email' => 'bassem@customer.sa',
        'subject' => 'Issue with SSL Certificate Renewal on Subdomain',
        'description' => 'The wildcard certificate expired yesterday.',
        'priority' => 'high',
        'status' => 'open',
    ]);

    expect($ticket->status)->toBe('open')
        ->and($ticket->resolved_at)->toBeNull();

    // Agent adds response message
    $ticket->messages()->create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'user_id' => $userA->id,
        'sender_type' => 'agent',
        'sender_name' => 'Support Engineer',
        'message' => 'We updated DNS challenge and renewed Let\'s Encrypt certificate.',
    ]);

    $resolveAction = app(ResolveTicketAction::class);
    $resolvedTicket = $resolveAction->execute($ticket, 'SSL certificate successfully bound to edge router.', $userA);

    expect($resolvedTicket->status)->toBe('resolved')
        ->and($resolvedTicket->resolved_at)->not->toBeNull()
        ->and($resolvedTicket->assigned_user_id)->toBe($userA->id)
        ->and($resolvedTicket->messages)->toHaveCount(2);
});

test('strict multi-tenant isolation prevents tenant B from viewing tenant A commercial data', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    $tenantB = Tenant::where('slug', 'al-binaa')->firstOrFail();
    $companyB = Company::where('tenant_id', $tenantB->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $leadA = Lead::firstOrCreate(
        ['company_id' => $companyA->id, 'lead_number' => 'LEAD-ISOLATION-A'],
        [
            'tenant_id' => $tenantA->id,
            'title' => 'Tenant A Private Lead',
            'contact_name' => 'Secret Customer A',
            'source' => 'website',
            'status' => 'qualified',
            'estimated_value' => '100000.000000',
        ]
    );

    // Switch context to Tenant B
    app(CurrentTenant::class)->set($tenantB);
    app(CurrentCompany::class)->set($companyB);

    $leadsInB = Lead::where('company_id', $companyB->id)->get();
    expect($leadsInB->pluck('id'))->not->toContain($leadA->id);

    $projectsInB = Project::where('company_id', $companyB->id)->get();
    $projectA = Project::where('company_id', $companyA->id)->first();
    if ($projectA) {
        expect($projectsInB->pluck('id'))->not->toContain($projectA->id);
    }

    $contractsInB = Contract::where('company_id', $companyB->id)->get();
    $contractA = Contract::where('company_id', $companyA->id)->first();
    if ($contractA) {
        expect($contractsInB->pluck('id'))->not->toContain($contractA->id);
    }
});
