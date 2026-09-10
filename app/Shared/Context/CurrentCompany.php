<?php

namespace App\Shared\Context;

use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;

class CurrentCompany
{
    protected ?Company $company = null;

    protected ?Branch $branch = null;

    public function set(?Company $company, ?Branch $branch = null): void
    {
        $this->company = $company;
        $this->branch = $branch;
    }

    public function get(): ?Company
    {
        return $this->company;
    }

    public function id(): ?string
    {
        return $this->company?->id;
    }

    public function branch(): ?Branch
    {
        return $this->branch;
    }

    public function branchId(): ?string
    {
        return $this->branch?->id;
    }

    public function check(): bool
    {
        return $this->company !== null;
    }
}
