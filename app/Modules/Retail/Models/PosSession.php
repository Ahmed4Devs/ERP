<?php

namespace App\Modules\Retail\Models;

use App\Models\User;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosSession extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'pos_sessions';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'terminal_id',
        'user_id',
        'session_number',
        'opening_cash',
        'closing_cash',
        'expected_cash',
        'cash_difference',
        'status', // open, closed
        'opened_at',
        'closed_at',
        'notes',
    ];

    protected $casts = [
        'opening_cash' => 'decimal:6',
        'closing_cash' => 'decimal:6',
        'expected_cash' => 'decimal:6',
        'cash_difference' => 'decimal:6',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function terminal(): BelongsTo
    {
        return $this->belongsTo(PosTerminal::class, 'terminal_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(PosOrder::class, 'session_id');
    }
}
