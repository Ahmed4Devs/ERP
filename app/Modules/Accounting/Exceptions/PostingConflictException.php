<?php

namespace App\Modules\Accounting\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class PostingConflictException extends HttpException
{
    public function __construct(string $message = 'Idempotency key reused with conflicting payload.')
    {
        parent::__construct(409, $message);
    }
}
