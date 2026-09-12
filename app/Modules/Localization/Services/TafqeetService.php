<?php

namespace App\Modules\Localization\Services;

class TafqeetService
{
    protected array $arUnits = [
        0 => '',
        1 => 'واحد',
        2 => 'اثنان',
        3 => 'ثلاثة',
        4 => 'أربعة',
        5 => 'خمسة',
        6 => 'ستة',
        7 => 'سبعة',
        8 => 'ثمانية',
        9 => 'تسعة',
        10 => 'عشرة',
        11 => 'أحد عشر',
        12 => 'اثنا عشر',
        13 => 'ثلاثة عشر',
        14 => 'أربعة عشر',
        15 => 'خمسة عشر',
        16 => 'ستة عشر',
        17 => 'سبعة عشر',
        18 => 'ثمانية عشر',
        19 => 'تسعة عشر',
    ];

    protected array $arTens = [
        2 => 'عشرون',
        3 => 'ثلاثون',
        4 => 'أربعون',
        5 => 'خمسون',
        6 => 'ستون',
        7 => 'سبعون',
        8 => 'ثمانون',
        9 => 'تسعون',
    ];

    protected array $arHundreds = [
        0 => '',
        1 => 'مائة',
        2 => 'مائتان',
        3 => 'ثلاثمائة',
        4 => 'أربعمائة',
        5 => 'خمسمائة',
        6 => 'ستمائة',
        7 => 'سبعمائة',
        8 => 'ثمانمائة',
        9 => 'تسعمائة',
    ];

    protected array $enUnits = [
        0 => '',
        1 => 'One',
        2 => 'Two',
        3 => 'Three',
        4 => 'Four',
        5 => 'Five',
        6 => 'Six',
        7 => 'Seven',
        8 => 'Eight',
        9 => 'Nine',
        10 => 'Ten',
        11 => 'Eleven',
        12 => 'Twelve',
        13 => 'Thirteen',
        14 => 'Fourteen',
        15 => 'Fifteen',
        16 => 'Sixteen',
        17 => 'Seventeen',
        18 => 'Eighteen',
        19 => 'Nineteen',
    ];

    protected array $enTens = [
        2 => 'Twenty',
        3 => 'Thirty',
        4 => 'Forty',
        5 => 'Fifty',
        6 => 'Sixty',
        7 => 'Seventy',
        8 => 'Eighty',
        9 => 'Ninety',
    ];

    /**
     * Convert currency amount to Arabic words.
     */
    public function inArabic(
        float|string|int $amount,
        string $mainCurrency = 'ريال سعودي',
        string $subCurrency = 'هللة'
    ): string {
        $amountStr = number_format((float) $amount, 2, '.', '');
        [$integerPart, $fractionPart] = explode('.', $amountStr);

        $intVal = (int) $integerPart;
        $fracVal = (int) $fractionPart;

        if ($intVal === 0 && $fracVal === 0) {
            return "صفر {$mainCurrency}";
        }

        $result = [];

        if ($intVal > 0) {
            $words = $this->convertIntegerToArabic($intVal);
            $result[] = "{$words} {$mainCurrency}";
        }

        if ($fracVal > 0) {
            $words = $this->convertIntegerToArabic($fracVal);
            $result[] = "{$words} {$subCurrency}";
        }

        return 'فقط '.implode(' و', $result).' لا غير';
    }

    /**
     * Convert currency amount to English words.
     */
    public function inEnglish(
        float|string|int $amount,
        string $mainCurrency = 'Saudi Riyals',
        string $subCurrency = 'Halalas'
    ): string {
        $amountStr = number_format((float) $amount, 2, '.', '');
        [$integerPart, $fractionPart] = explode('.', $amountStr);

        $intVal = (int) $integerPart;
        $fracVal = (int) $fractionPart;

        if ($intVal === 0 && $fracVal === 0) {
            return "Zero {$mainCurrency} Only";
        }

        $parts = [];

        if ($intVal > 0) {
            $parts[] = $this->convertIntegerToEnglish($intVal)." {$mainCurrency}";
        }

        if ($fracVal > 0) {
            $parts[] = $this->convertIntegerToEnglish($fracVal)." {$subCurrency}";
        }

        return 'Only '.implode(' and ', $parts).' Only';
    }

    protected function convertIntegerToArabic(int $number): string
    {
        if ($number === 0) {
            return 'صفر';
        }

        $groups = [];
        $scales = [
            1000000000 => ['مليار', 'ملياران', 'مليارات', 'ملياراً'],
            1000000 => ['مليون', 'مليونان', 'ملايين', 'مليوناً'],
            1000 => ['ألف', 'ألفان', 'آلاف', 'ألفاً'],
        ];

        foreach ($scales as $scale => $labels) {
            if ($number >= $scale) {
                $count = intdiv($number, $scale);
                $number %= $scale;

                if ($count === 1) {
                    $groups[] = $labels[0];
                } elseif ($count === 2) {
                    $groups[] = $labels[1];
                } elseif ($count >= 3 && $count <= 10) {
                    $groups[] = $this->convertThreeDigitsToArabic($count).' '.$labels[2];
                } else {
                    $groups[] = $this->convertThreeDigitsToArabic($count).' '.$labels[3];
                }
            }
        }

        if ($number > 0) {
            $groups[] = $this->convertThreeDigitsToArabic($number);
        }

        return implode(' و', $groups);
    }

    protected function convertThreeDigitsToArabic(int $number): string
    {
        $parts = [];

        $hundreds = intdiv($number, 100);
        $remainder = $number % 100;

        if ($hundreds > 0) {
            $parts[] = $this->arHundreds[$hundreds];
        }

        if ($remainder > 0) {
            if ($remainder < 20) {
                $parts[] = $this->arUnits[$remainder];
            } else {
                $ones = $remainder % 10;
                $tens = intdiv($remainder, 10);

                if ($ones > 0) {
                    $parts[] = $this->arUnits[$ones].' و'.$this->arTens[$tens];
                } else {
                    $parts[] = $this->arTens[$tens];
                }
            }
        }

        return implode(' و', $parts);
    }

    protected function convertIntegerToEnglish(int $number): string
    {
        if ($number === 0) {
            return 'Zero';
        }

        $scales = [
            1000000000 => 'Billion',
            1000000 => 'Million',
            1000 => 'Thousand',
        ];

        $words = [];

        foreach ($scales as $scale => $label) {
            if ($number >= $scale) {
                $count = intdiv($number, $scale);
                $number %= $scale;
                $words[] = $this->convertThreeDigitsToEnglish($count).' '.$label;
            }
        }

        if ($number > 0) {
            $words[] = $this->convertThreeDigitsToEnglish($number);
        }

        return implode(' ', $words);
    }

    protected function convertThreeDigitsToEnglish(int $number): string
    {
        $parts = [];

        $hundreds = intdiv($number, 100);
        $remainder = $number % 100;

        if ($hundreds > 0) {
            $parts[] = $this->enUnits[$hundreds].' Hundred';
        }

        if ($remainder > 0) {
            if ($remainder < 20) {
                $parts[] = $this->enUnits[$remainder];
            } else {
                $tens = intdiv($remainder, 10);
                $ones = $remainder % 10;

                $tensStr = $this->enTens[$tens];
                if ($ones > 0) {
                    $tensStr .= '-'.$this->enUnits[$ones];
                }
                $parts[] = $tensStr;
            }
        }

        return implode(' and ', $parts);
    }
}
