<?php

namespace App\Modules\HR\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Designation extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'designations';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'code',
        'title',
        'title_ar',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'designation_id');
    }
}
