"""
Problem set for Academic Guild Wars. Run from backend/:  python seed_problems.py
difficulty: 1 = easy, 2 = medium, 3 = hard
All problems read from stdin and print to stdout (see each description).
"""
from database import SessionLocal
from models.problem import Problem
from models.testcase import TestCase

PROBLEMS = [
    {
        "title": 'Pair Sum Indices',
        "slug": 'pair-sum-indices',
        "difficulty": 1,
        "description": 'Two travelers want to split a bridge toll that exactly equals a target amount. Given a list of integers, find two different positions whose values add up to the target.\n\nInput:\nLine 1: n (count of numbers)\nLine 2: n space-separated integers\nLine 3: target\n\nOutput: the two indices i and j (i < j) separated by a space. Choose the smallest i, then the smallest j. A valid pair always exists.',
        "test_cases": [
            {"input_data": '4\n2 7 11 15\n9', "expected_output": '0 1', "is_sample": True},
            {"input_data": '3\n3 2 4\n6', "expected_output": '1 2', "is_sample": True},
            {"input_data": '6\n32 -12 51 -38 -32 87\n83', "expected_output": '0 2', "is_sample": False},
            {"input_data": '10\n99 -36 79 4 -41 -28 61 57 -33 11\n-69', "expected_output": '1 8', "is_sample": False},
            {"input_data": '30\n58 -35 94 -19 7 98 51 -38 6 -39 -16 24 57 -14 -20 28 -4 -24 -2 45 -26 -34 97 29 82 13 37 18 4 49\n-36', "expected_output": '10 14', "is_sample": False},
            {"input_data": '2\n-5 5\n0', "expected_output": '0 1', "is_sample": False},
            {"input_data": '60\n99 66 42 26 13 -4 12 -30 96 84 76 37 64 23 -32 -20 81 57 -8 88 -12 75 82 -45 73 35 -41 47 21 86 51 62 54 -10 -7 38 -6 91 95 24 52 8 -42 -39 -16 10 39 74 77 -43 43 53 -11 32 70 80 7 -14 41 -1\n-35', "expected_output": '23 45', "is_sample": False},
        ],
    },
    {
        "title": 'Mirror Words',
        "slug": 'mirror-words',
        "difficulty": 1,
        "description": 'Print the given line reversed.\n\nInput: one line of text (letters, digits, spaces).\nOutput: the same text reversed.',
        "test_cases": [
            {"input_data": 'hello', "expected_output": 'olleh', "is_sample": True},
            {"input_data": 'forest guild', "expected_output": 'dliug tserof', "is_sample": True},
            {"input_data": 'a', "expected_output": 'a', "is_sample": False},
            {"input_data": 'racecar', "expected_output": 'racecar', "is_sample": False},
            {"input_data": 'Academic Guild Wars', "expected_output": 'sraW dliuG cimedacA', "is_sample": False},
            {"input_data": '12345 67890', "expected_output": '09876 54321', "is_sample": False},
            {"input_data": 'za1zcb1axycx  1bc1 2yc 2y z xcbccxxa1cyy', "expected_output": 'yyc1axxccbcx z y2 cy2 1cb1  xcyxa1bcz1az', "is_sample": False},
        ],
    },
    {
        "title": 'Palindrome Check',
        "slug": 'palindrome-check',
        "difficulty": 1,
        "description": 'Decide whether a line is a palindrome, ignoring case and any non-alphanumeric characters.\n\nInput: one line of text.\nOutput: YES or NO.',
        "test_cases": [
            {"input_data": 'A man, a plan, a canal: Panama', "expected_output": 'YES', "is_sample": True},
            {"input_data": 'hello', "expected_output": 'NO', "is_sample": True},
            {"input_data": 'x', "expected_output": 'YES', "is_sample": False},
            {"input_data": 'No lemon, no melon', "expected_output": 'YES', "is_sample": False},
            {"input_data": 'Was it a car or a cat I saw?', "expected_output": 'YES', "is_sample": False},
            {"input_data": 'ab', "expected_output": 'NO', "is_sample": False},
            {"input_data": 'Not a palindrome!!', "expected_output": 'NO', "is_sample": False},
        ],
    },
    {
        "title": 'Fizz Buzz Run',
        "slug": 'fizz-buzz-run',
        "difficulty": 1,
        "description": 'For each number from 1 to n print: FizzBuzz if divisible by both 3 and 5, Fizz if divisible by 3, Buzz if divisible by 5, otherwise the number itself. One value per line.\n\nInput: n\nOutput: n lines.',
        "test_cases": [
            {"input_data": '5', "expected_output": '1\n2\nFizz\n4\nBuzz', "is_sample": True},
            {"input_data": '15', "expected_output": '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', "is_sample": True},
            {"input_data": '1', "expected_output": '1', "is_sample": False},
            {"input_data": '3', "expected_output": '1\n2\nFizz', "is_sample": False},
            {"input_data": '30', "expected_output": '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz\nFizz\n22\n23\nFizz\nBuzz\n26\nFizz\n28\n29\nFizzBuzz', "is_sample": False},
            {"input_data": '100', "expected_output": '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz\nFizz\n22\n23\nFizz\nBuzz\n26\nFizz\n28\n29\nFizzBuzz\n31\n32\nFizz\n34\nBuzz\nFizz\n37\n38\nFizz\nBuzz\n41\nFizz\n43\n44\nFizzBuzz\n46\n47\nFizz\n49\nBuzz\nFizz\n52\n53\nFizz\nBuzz\n56\nFizz\n58\n59\nFizzBuzz\n61\n62\nFizz\n64\nBuzz\nFizz\n67\n68\nFizz\nBuzz\n71\nFizz\n73\n74\nFizzBuzz\n76\n77\nFizz\n79\nBuzz\nFizz\n82\n83\nFizz\nBuzz\n86\nFizz\n88\n89\nFizzBuzz\n91\n92\nFizz\n94\nBuzz\nFizz\n97\n98\nFizz\nBuzz', "is_sample": False},
        ],
    },
    {
        "title": 'Balanced Brackets',
        "slug": 'balanced-brackets',
        "difficulty": 1,
        "description": 'Given a string made only of ( ) [ ] { }, decide whether every bracket is closed by the correct type in the correct order.\n\nInput: one line.\nOutput: YES or NO.',
        "test_cases": [
            {"input_data": '()[]{}', "expected_output": 'YES', "is_sample": True},
            {"input_data": '(]', "expected_output": 'NO', "is_sample": True},
            {"input_data": '([{}])', "expected_output": 'YES', "is_sample": False},
            {"input_data": '((', "expected_output": 'NO', "is_sample": False},
            {"input_data": ']', "expected_output": 'NO', "is_sample": False},
            {"input_data": '{[()]}[', "expected_output": 'NO', "is_sample": False},
            {"input_data": '([)]', "expected_output": 'NO', "is_sample": False},
            {"input_data": '(((((())))))', "expected_output": 'YES', "is_sample": False},
        ],
    },
    {
        "title": 'Missing Number',
        "slug": 'missing-number',
        "difficulty": 1,
        "description": 'A list holds n distinct numbers taken from 0..n, so exactly one number in that range is missing. Find it.\n\nInput:\nLine 1: n\nLine 2: n space-separated integers\nOutput: the missing number.',
        "test_cases": [
            {"input_data": '3\n3 0 1', "expected_output": '2', "is_sample": True},
            {"input_data": '4\n0 1 3 4', "expected_output": '2', "is_sample": True},
            {"input_data": '1\n1', "expected_output": '0', "is_sample": False},
            {"input_data": '5\n0 2 5 3 4', "expected_output": '1', "is_sample": False},
            {"input_data": '20\n2 5 10 6 12 16 9 3 0 14 11 8 19 18 7 20 13 15 1 17', "expected_output": '4', "is_sample": False},
            {"input_data": '100\n97 30 4 24 54 45 58 28 47 17 50 69 27 91 55 7 64 70 65 51 11 52 40 100 63 36 8 35 29 98 81 49 31 37 38 25 88 94 95 21 84 42 56 85 22 71 75 53 16 57 5 41 86 66 87 1 34 83 90 23 67 77 80 89 2 20 73 33 43 99 18 10 39 74 61 59 62 14 15 60 93 78 44 32 82 96 48 92 26 9 3 79 46 12 68 19 72 0 13 6', "expected_output": '76', "is_sample": False},
        ],
    },
    {
        "title": 'Peak Earnings Window',
        "slug": 'peak-earnings-window',
        "difficulty": 2,
        "description": 'Daily profits (some negative) are listed in order. Find the largest possible sum of a contiguous, non-empty stretch of days.\n\nInput:\nLine 1: n\nLine 2: n space-separated integers\nOutput: the maximum sum.',
        "test_cases": [
            {"input_data": '5\n-2 1 -3 4 5', "expected_output": '9', "is_sample": True},
            {"input_data": '3\n-3 -1 -2', "expected_output": '-1', "is_sample": True},
            {"input_data": '1\n4', "expected_output": '4', "is_sample": False},
            {"input_data": '8\n-8 10 -9 7 20 1 -15 5', "expected_output": '29', "is_sample": False},
            {"input_data": '20\n9 5 -15 -10 -10 -12 -19 -11 17 9 -11 19 18 10 2 -11 15 15 -12 -19', "expected_output": '83', "is_sample": False},
            {"input_data": '200\n-20 -14 13 -12 7 -8 -7 -19 -4 -7 -2 12 -5 17 0 -4 14 6 -12 -17 2 9 17 13 6 12 -12 14 -11 13 12 -19 8 -9 18 -20 -11 -9 -11 10 19 -13 15 -17 0 13 13 15 10 -14 15 -17 -5 -8 -3 -18 -14 12 8 15 -19 -16 8 0 19 12 18 12 -8 -3 8 12 14 10 12 -5 13 -4 15 -8 8 -12 6 -13 5 8 0 -16 -5 7 -16 -7 -1 -13 -11 3 -11 -4 -12 9 -6 -14 5 11 -10 -6 -10 7 12 5 1 6 -8 2 0 -15 3 -19 1 15 9 8 -19 4 1 13 19 -2 12 -16 -13 -6 -14 -15 -4 -3 -18 -9 -3 -12 7 -4 5 -11 14 12 16 11 0 -15 -3 -17 -9 7 -16 -3 -19 20 -15 -4 -15 18 -6 -16 -4 -13 9 -20 1 15 6 -3 19 -12 -18 13 -5 -13 -10 -4 -17 -9 -8 -1 20 -1 13 -7 -2 8 12 -9 -3 2 -19 -4 -18 -20 -19 12', "expected_output": '167', "is_sample": False},
            {"input_data": '4\n5 4 -1 7', "expected_output": '15', "is_sample": False},
        ],
    },
    {
        "title": 'Longest Unique Stretch',
        "slug": 'longest-unique-stretch',
        "difficulty": 2,
        "description": 'Find the length of the longest substring that contains no repeated character.\n\nInput: one line (lowercase letters, may be empty-free, length >= 1).\nOutput: the length.',
        "test_cases": [
            {"input_data": 'abcabcbb', "expected_output": '3', "is_sample": True},
            {"input_data": 'bbbbb', "expected_output": '1', "is_sample": True},
            {"input_data": 'pwwkew', "expected_output": '3', "is_sample": False},
            {"input_data": 'a', "expected_output": '1', "is_sample": False},
            {"input_data": 'abcdef', "expected_output": '6', "is_sample": False},
            {"input_data": 'abba', "expected_output": '2', "is_sample": False},
            {"input_data": 'ebedbdafgfdfdegdecfbbcbgfffbdcagbaaffcdbaafgdgefcebfcadbbcda', "expected_output": '6', "is_sample": False},
            {"input_data": 'effifdaedfcafgbheiddiabebcgjagaeedbjicjgfhcejcaigiciijajdbaacfbghiaaidheahbiibibhebedddhhgbheajdbjcf', "expected_output": '9', "is_sample": False},
        ],
    },
    {
        "title": 'Sorted Search',
        "slug": 'sorted-search',
        "difficulty": 2,
        "description": 'Given a strictly increasing list and a target, print the index of the target, or -1 if it is absent. Aim for O(log n).\n\nInput:\nLine 1: n\nLine 2: n sorted integers\nLine 3: target\nOutput: index (0-based) or -1.',
        "test_cases": [
            {"input_data": '5\n1 3 5 7 9\n7', "expected_output": '3', "is_sample": True},
            {"input_data": '3\n2 4 6\n5', "expected_output": '-1', "is_sample": True},
            {"input_data": '1\n40\n40', "expected_output": '0', "is_sample": False},
            {"input_data": '10\n-949 -752 -593 -454 100 975 989 1325 1544 1752\n-454', "expected_output": '3', "is_sample": False},
            {"input_data": '50\n-986 -929 -899 -695 -687 -649 -631 -539 -515 -457 -420 -349 -184 -141 -137 -53 72 100 145 169 186 191 276 472 495 584 614 840 846 879 903 908 910 937 991 1005 1013 1039 1075 1083 1115 1146 1249 1381 1471 1587 1767 1791 1880 1903\n584', "expected_output": '25', "is_sample": False},
            {"input_data": '50\n-993 -952 -882 -803 -789 -734 -688 -584 -509 -505 -424 -391 -223 -199 -167 21 37 88 127 149 169 187 236 292 294 329 357 385 408 477 524 529 540 598 609 631 638 704 752 753 786 1092 1249 1269 1413 1584 1600 1711 1920 1978\n1000', "expected_output": '-1', "is_sample": False},
            {"input_data": '500\n-1000 -996 -995 -989 -985 -982 -976 -975 -973 -965 -958 -954 -940 -926 -918 -911 -904 -901 -881 -876 -872 -870 -868 -862 -861 -858 -849 -847 -844 -839 -835 -834 -822 -820 -800 -799 -798 -794 -790 -789 -788 -782 -778 -774 -769 -754 -747 -746 -744 -743 -741 -735 -733 -726 -724 -712 -705 -701 -693 -681 -680 -677 -675 -670 -668 -656 -652 -647 -641 -636 -630 -629 -627 -621 -606 -593 -589 -585 -581 -570 -567 -561 -555 -554 -541 -537 -535 -512 -510 -504 -494 -486 -485 -482 -479 -476 -468 -457 -456 -433 -429 -421 -419 -417 -403 -401 -381 -378 -372 -368 -367 -359 -345 -344 -342 -338 -335 -330 -322 -315 -307 -301 -297 -291 -285 -272 -251 -246 -242 -241 -240 -233 -229 -224 -219 -215 -212 -210 -206 -205 -202 -199 -193 -192 -189 -185 -180 -173 -167 -166 -165 -160 -151 -149 -147 -140 -128 -116 -109 -99 -93 -91 -86 -85 -84 -72 -67 -55 -54 -53 -48 -47 -43 -41 -39 -38 -36 -33 -23 -21 -8 -1 4 7 11 12 13 15 17 28 30 31 40 44 47 52 53 58 64 65 66 68 73 84 85 96 106 110 115 128 136 141 144 146 152 154 160 172 196 202 203 208 218 219 230 232 235 242 244 259 264 276 277 278 279 286 288 295 296 307 308 324 334 336 340 342 348 358 363 372 384 385 388 392 400 407 425 432 439 460 463 475 482 484 486 490 491 493 508 510 516 518 522 524 526 527 531 538 543 550 557 568 571 575 583 588 589 600 603 604 611 615 619 622 623 624 629 637 657 658 663 670 671 675 678 682 686 690 695 696 699 701 705 707 708 711 720 721 722 724 735 738 741 747 750 761 768 771 778 791 799 812 826 828 830 836 838 839 841 843 846 855 873 886 887 900 905 907 915 917 934 938 939 943 944 946 973 977 979 980 986 988 1006 1009 1019 1021 1030 1033 1036 1040 1041 1050 1061 1066 1067 1078 1096 1099 1134 1139 1146 1148 1149 1155 1162 1163 1167 1187 1201 1205 1218 1230 1240 1243 1244 1253 1254 1258 1259 1263 1276 1282 1298 1320 1321 1332 1333 1346 1352 1366 1368 1387 1388 1405 1436 1439 1440 1441 1455 1459 1461 1470 1480 1487 1488 1498 1518 1522 1527 1539 1540 1543 1554 1558 1561 1566 1578 1584 1587 1596 1606 1634 1639 1640 1643 1645 1650 1651 1655 1660 1666 1672 1673 1678 1683 1686 1688 1716 1721 1725 1728 1733 1739 1762 1766 1788 1792 1793 1795 1802 1804 1812 1813 1835 1837 1838 1841 1842 1848 1849 1855 1861 1871 1879 1890 1896 1906 1911 1912 1918 1919 1947 1965 1966 1977 1987 1988 1996 1998 1999\n721', "expected_output": '317', "is_sample": False},
        ],
    },
    {
        "title": 'Merge Overlapping Ranges',
        "slug": 'merge-overlapping-ranges',
        "difficulty": 2,
        "description": "Given closed ranges [start, end], merge all that overlap or touch, and print the result sorted by start.\n\nInput:\nLine 1: n\nNext n lines: start end\nOutput: one merged range per line as 'start end'.",
        "test_cases": [
            {"input_data": '3\n1 3\n2 6\n8 10', "expected_output": '1 6\n8 10', "is_sample": True},
            {"input_data": '2\n1 4\n4 5', "expected_output": '1 5', "is_sample": True},
            {"input_data": '1\n25 28', "expected_output": '25 28', "is_sample": False},
            {"input_data": '5\n30 32\n36 39\n2 8\n33 35\n24 29', "expected_output": '2 8\n24 29\n30 32\n33 35\n36 39', "is_sample": False},
            {"input_data": '10\n7 9\n15 18\n2 10\n2 7\n7 13\n38 45\n35 39\n26 30\n37 40\n27 33', "expected_output": '2 13\n15 18\n26 33\n35 45', "is_sample": False},
            {"input_data": '25\n23 30\n32 39\n11 11\n0 7\n29 32\n28 35\n11 18\n25 26\n4 6\n22 28\n23 24\n28 36\n32 32\n2 4\n5 10\n32 33\n3 11\n24 26\n1 2\n39 40\n12 14\n31 35\n10 13\n4 9\n39 43', "expected_output": '0 18\n22 43', "is_sample": False},
        ],
    },
    {
        "title": 'Forest Patches',
        "slug": 'forest-patches',
        "difficulty": 2,
        "description": 'A map marks forest with 1 and cleared land with 0. A patch is a group of 1s connected up, down, left or right. Count the patches.\n\nInput:\nLine 1: r c\nNext r lines: a string of c characters (0 or 1)\nOutput: number of patches.',
        "test_cases": [
            {"input_data": '3 4\n1100\n0010\n0011', "expected_output": '2', "is_sample": True},
            {"input_data": '2 2\n11\n11', "expected_output": '1', "is_sample": True},
            {"input_data": '1 1\n1', "expected_output": '1', "is_sample": False},
            {"input_data": '4 5\n01010\n01101\n11100\n01010', "expected_output": '4', "is_sample": False},
            {"input_data": '8 8\n01000010\n01010010\n01010100\n00111100\n00110111\n11100100\n10111000\n01100100', "expected_output": '4', "is_sample": False},
            {"input_data": '12 15\n001010011010011\n000011110001000\n001111100001000\n010010111000101\n100000000000011\n010111011110000\n101000100011110\n000011101101110\n110000100010010\n101110010001010\n101100101000010\n101011100101000', "expected_output": '25', "is_sample": False},
            {"input_data": '20 20\n00001000100010011000\n11100101001010000010\n11010000001000000001\n00000000001000010000\n00100000101000100000\n00001000100110100001\n10001001100000100000\n01010001010110110000\n00001000100110011110\n01001000000010000001\n11010100001000000001\n00100000000100000000\n10000100010000001000\n10001011000000000001\n00011100000001000000\n10110000100000010111\n10101011010110000100\n00100110010010010000\n10000000000110000000\n00000000011100001000', "expected_output": '51', "is_sample": False},
        ],
    },
    {
        "title": 'Fewest Coins',
        "slug": 'fewest-coins',
        "difficulty": 2,
        "description": 'Given coin values (unlimited supply of each) and an amount, print the minimum number of coins needed to make exactly that amount, or -1 if it is impossible.\n\nInput:\nLine 1: amount\nLine 2: space-separated coin values\nOutput: the minimum count or -1.',
        "test_cases": [
            {"input_data": '11\n1 2 5', "expected_output": '3', "is_sample": True},
            {"input_data": '3\n2', "expected_output": '-1', "is_sample": True},
            {"input_data": '0\n1', "expected_output": '0', "is_sample": False},
            {"input_data": '7\n2 4', "expected_output": '-1', "is_sample": False},
            {"input_data": '30\n1 5 10 25', "expected_output": '2', "is_sample": False},
            {"input_data": '63\n1 5 10 21 25', "expected_output": '3', "is_sample": False},
            {"input_data": '100\n7 13 19', "expected_output": '10', "is_sample": False},
        ],
    },
    {
        "title": 'Common Thread',
        "slug": 'common-thread',
        "difficulty": 3,
        "description": 'Find the length of the longest common subsequence (characters in order, not necessarily adjacent) of two strings.\n\nInput:\nLine 1: string A\nLine 2: string B\nOutput: the length.',
        "test_cases": [
            {"input_data": 'abcde\nace', "expected_output": '3', "is_sample": True},
            {"input_data": 'abc\ndef', "expected_output": '0', "is_sample": True},
            {"input_data": 'a\na', "expected_output": '1', "is_sample": False},
            {"input_data": 'cabccbbcac\ncbbacabcac', "expected_output": '7', "is_sample": False},
            {"input_data": 'bbcabcabbcacbaabccbcbbccaaaaaa\ncbbccbbcaaabbabcbaabcabbccaaaa', "expected_output": '23', "is_sample": False},
            {"input_data": 'cbccabbbabccababaabaaaacbcbbaccbacabbcacaccbababacaaabbacaabccccbaaabaaccbccbcabbbbbabbbabaacabcaaaa\nacbcababacabbbabacbabacaacbcababbbaaabcbbabbabbbaacaccacbbababbbaaabbbaacbacabcbcabacbabbababcaaacac', "expected_output": '71', "is_sample": False},
            {"input_data": 'aaaabbaaaabaaababbbbaabbabaabaababbaababbababbaaaaaaaaabbaaaababababaaababbbaaabaaaabbaabbababbbabbbbababababaaabbaaaabbbaaabbaabaabaababbaaabababaabbbbaabbababbbbbbaabaabbabaabbbbbabaaaabbabbbaaabbbaababbabaababbabbabbbbbbbbbbabbbbababbaabbababaaabbbbbbbbbabbaaaabbbaabbbbbaabbbabaabbbabaabaaababaab\nabbaaaaabbaabaaaaaaaabbbaabaabbaabaababbaaababaaaaaaababbbbbaababbbbaaaaabbaabbbabbbbaabbababbbabababaaaaababbaabbabbabbaababbbabaaaabbaababaaabaaabbaabaababbbbbabaabbbababbaababaabaababababaabbbbaabaaaaabababbababbbbbaababaabaaabaaabbbaabaabbaaababbaaababaabbaababbaaabbaabbaabbbbbaaaabbabbabbbababa', "expected_output": '239', "is_sample": False},
        ],
    },
    {
        "title": 'Word Morph',
        "slug": 'word-morph',
        "difficulty": 3,
        "description": 'The minimum number of single-character insertions, deletions or replacements needed to turn string A into string B.\n\nInput:\nLine 1: string A\nLine 2: string B\nOutput: the minimum number of edits.',
        "test_cases": [
            {"input_data": 'horse\nros', "expected_output": '3', "is_sample": True},
            {"input_data": 'intention\nexecution', "expected_output": '5', "is_sample": True},
            {"input_data": 'a\nb', "expected_output": '1', "is_sample": False},
            {"input_data": 'abc\nabc', "expected_output": '0', "is_sample": False},
            {"input_data": 'ccbabaadbccb\nbaccdbccb', "expected_output": '5', "is_sample": False},
            {"input_data": 'bacbbaaaacccbaabbbcabcccaacaaabcbaabbaac\nbaaccbabacaccbbabacacabbabccbcabacb', "expected_output": '20', "is_sample": False},
            {"input_data": 'cbbccabccaaccbccbccbbbccabbccaaaccbcaaccbccbbcacbbbaaaaccaabcaaccbcbacbacccaccccabcabaccccacccabcbcaacbaabcabaabaaccabbacabacacacbabcbccabaabcccbcbacbabcbcaacabbacbacbaabaabaacbccbacbccbbaababcbaaaacc\nccbbacbbaccabbcabaccaaabcbbcbbbbabcbbaaabcacaccabbbacbbccccacacaabcccabbaacabbcbccabccbbacbcbbcbaabaaaacbbbbcbacaabcbbccccbaacacabcbbbcbcabbabbcaacbacaaabbacbccaaacaacaaacbcaaabccacbaabbcacbbccbaabaac', "expected_output": '89', "is_sample": False},
        ],
    },
    {
        "title": 'Backpack Loot',
        "slug": 'backpack-loot',
        "difficulty": 3,
        "description": 'You can carry total weight at most W. Each item (used at most once) has a weight and a value. Maximize the total value carried.\n\nInput:\nLine 1: n W\nNext n lines: weight value\nOutput: the maximum total value.',
        "test_cases": [
            {"input_data": '3 50\n10 60\n20 100\n30 120', "expected_output": '220', "is_sample": True},
            {"input_data": '2 5\n6 10\n7 20', "expected_output": '0', "is_sample": True},
            {"input_data": '1 10\n10 22', "expected_output": '22', "is_sample": False},
            {"input_data": '5 15\n8 39\n7 17\n8 1\n1 21\n10 21', "expected_output": '60', "is_sample": False},
            {"input_data": '15 40\n1 27\n10 22\n3 6\n1 10\n4 10\n9 6\n6 24\n7 23\n9 38\n9 10\n11 39\n10 22\n4 40\n5 31\n1 20', "expected_output": '229', "is_sample": False},
            {"input_data": '40 100\n11 36\n12 30\n9 18\n6 34\n9 18\n3 17\n1 36\n8 7\n11 24\n3 15\n7 6\n1 40\n3 8\n1 35\n9 14\n9 12\n5 39\n6 10\n3 11\n9 2\n6 16\n8 32\n4 23\n7 30\n4 21\n1 7\n11 1\n2 26\n11 23\n1 15\n10 25\n7 25\n11 15\n1 17\n1 17\n12 28\n4 15\n6 14\n6 28\n11 18', "expected_output": '568', "is_sample": False},
            {"input_data": '100 500\n5 32\n4 37\n3 31\n5 9\n5 19\n2 22\n1 32\n4 11\n6 40\n10 29\n4 38\n1 14\n12 24\n1 29\n3 28\n3 20\n11 2\n2 10\n1 9\n5 10\n9 23\n2 11\n8 26\n2 27\n6 26\n6 3\n10 16\n4 1\n1 9\n9 39\n4 37\n7 7\n12 2\n1 21\n2 8\n2 32\n3 34\n7 1\n3 15\n11 35\n3 35\n9 8\n9 23\n8 5\n6 14\n4 5\n5 12\n1 17\n5 5\n1 13\n9 4\n7 36\n6 18\n1 21\n12 3\n11 30\n9 19\n9 22\n12 27\n12 18\n7 28\n6 35\n7 25\n3 25\n7 27\n3 1\n4 39\n9 17\n12 40\n12 25\n4 13\n11 8\n2 40\n1 4\n7 36\n6 29\n9 21\n8 37\n1 31\n12 31\n9 22\n10 35\n7 16\n11 25\n6 5\n7 34\n5 40\n11 21\n2 35\n11 15\n10 17\n5 31\n12 23\n9 38\n8 37\n4 10\n2 34\n6 34\n4 34\n3 24', "expected_output": '2141', "is_sample": False},
        ],
    },
]

def seed():
    db = SessionLocal()
    try:
        for p in PROBLEMS:
            if db.query(Problem).filter(Problem.slug == p["slug"]).first():
                print(f"Skipping {p['slug']} (already exists)")
                continue
            problem = Problem(
                title=p["title"],
                slug=p["slug"],
                description=p["description"],
                difficulty=p["difficulty"],
                function_signature=p.get("function_signature"),
            )
            db.add(problem)
            db.flush()
            for tc in p["test_cases"]:
                db.add(TestCase(problem_id=problem.id, **tc))
            print(f"Seeded {p['slug']}")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()