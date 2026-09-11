<?php

namespace App\Modules\Inventory\Exceptions;

use Exception;

class InsufficientStockException extends Exception
{
    public function __construct(
        string $message = 'Insufficient stock available for this transaction.',
        int $code = 422,
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }
}
