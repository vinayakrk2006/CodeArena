"""Editorials and sample solutions. Every solution was run against all test cases."""

GUIDES = {'sum-two-integers': {'approach': 'Read both numbers from the single input line, turn them into integers, '
                                  'and print their sum.',
                      'hints': ['input().split() breaks the line into two pieces of text.',
                                'Convert each piece with int() before adding, or you will join text instead '
                                'of adding numbers.'],
                      'complexity': 'Time O(1), space O(1).',
                      'solutions': {'python': 'a, b = map(int, input().split())\nprint(a + b)'}},
 'even-or-odd': {'approach': 'A number is even when dividing it by 2 leaves no remainder. The % operator '
                             'gives that remainder.',
                 'hints': ['n % 2 is 0 for even numbers.',
                           'Use a conditional to choose which word to print.'],
                 'complexity': 'Time O(1), space O(1).',
                 'solutions': {'python': 'n = int(input())\nprint("Even" if n % 2 == 0 else "Odd")'}},
 'sum-1-to-n': {'approach': 'Start a running total at 0 and add every number from 1 to n. There is also a '
                            'shortcut formula, n * (n + 1) / 2, that needs no loop.',
                'hints': ['range(1, n + 1) gives 1 up to and including n.',
                          'Keep a variable called total and add to it in each step.'],
                'complexity': 'Loop: time O(n). Formula: time O(1).',
                'solutions': {'python': 'n = int(input())\n'
                                        'total = 0\n'
                                        'for i in range(1, n + 1):\n'
                                        '    total += i\n'
                                        'print(total)'}},
 'palindrome-check': {'approach': 'A palindrome reads the same forwards and backwards, so compare the word '
                                  'with its reverse.',
                      'hints': ['In Python, s[::-1] gives the reversed text.',
                                'Other languages: compare the first and last letters, then move inwards.'],
                      'complexity': 'Time O(n), space O(n) with a reversed copy, or O(1) with two pointers.',
                      'solutions': {'python': 's = input().strip()\nprint("Yes" if s == s[::-1] else "No")'}},
 'max-subarray': {'approach': 'Walk through the numbers once and keep the best sum of a subarray ending at '
                              'the current number. At each step, either extend the previous subarray or '
                              "start fresh at this number, whichever is larger. This is Kadane's algorithm.",
                  'hints': ['If the running sum before this number is negative, it only hurts, so start '
                            'again.',
                            'Keep a second variable for the best sum seen so far.',
                            'Start both variables from the first element, so all-negative input still '
                            'works.'],
                  'complexity': 'Time O(n), space O(1).',
                  'solutions': {'python': 'n = int(input())\n'
                                          'a = list(map(int, input().split()))\n'
                                          'best = cur = a[0]\n'
                                          'for x in a[1:]:\n'
                                          '    cur = max(x, cur + x)\n'
                                          '    best = max(best, cur)\n'
                                          'print(best)'}},
 'factorial': {'approach': 'Multiply all the whole numbers from 1 up to n. By definition 0! is 1, so start '
                           'the result at 1.',
               'hints': ['Start with result = 1 so n = 0 and n = 1 work without special cases.',
                         'Multiply by each i from 2 to n.'],
               'complexity': 'Time O(n), space O(1).',
               'solutions': {'python': 'n = int(input())\n'
                                       'result = 1\n'
                                       'for i in range(2, n + 1):\n'
                                       '    result *= i\n'
                                       'print(result)'}},
 'count-vowels': {'approach': 'Go through the word one letter at a time and add one to a counter whenever '
                              'the letter is a, e, i, o or u.',
                  'hints': ['Check each letter with: letter in "aeiou".', 'A counter variable starts at 0.'],
                  'complexity': 'Time O(n), space O(1).',
                  'solutions': {'python': 'word = input().strip()\n'
                                          'print(sum(1 for c in word if c in "aeiou"))'}},
 'largest-of-three': {'approach': 'Keep track of the largest number seen so far, and update it when a bigger '
                                  'number appears. Most languages also have a built-in max.',
                      'hints': ['Start with the first number as the largest.',
                                'Compare it with the second, then with the third.'],
                      'complexity': 'Time O(1), space O(1).',
                      'solutions': {'python': 'a, b, c = map(int, input().split())\nprint(max(a, b, c))'}},
 'prime-check': {'approach': 'A prime has no divisors other than 1 and itself. You only need to test '
                             'divisors up to the square root of n, because any larger divisor pairs with a '
                             'smaller one. Numbers below 2 are not prime.',
                 'hints': ['Handle n < 2 first.',
                           'Try i = 2, 3, 4, ... while i * i <= n.',
                           'Stop as soon as you find a divisor.'],
                 'complexity': 'Time O(sqrt(n)), space O(1).',
                 'solutions': {'python': 'n = int(input())\n'
                                         'if n < 2:\n'
                                         '    print("Not prime")\n'
                                         'else:\n'
                                         '    i = 2\n'
                                         '    prime = True\n'
                                         '    while i * i <= n:\n'
                                         '        if n % i == 0:\n'
                                         '            prime = False\n'
                                         '            break\n'
                                         '        i += 1\n'
                                         '    print("Prime" if prime else "Not prime")'}},
 'nth-fibonacci': {'approach': 'Each Fibonacci number is the sum of the two before it. Keep just the last '
                               'two values and move forward n times.',
                   'hints': ['Start with a = 0 and b = 1.',
                             'In each step: new a is old b, new b is old a + old b.',
                             'After n steps, a holds F(n).'],
                   'complexity': 'Time O(n), space O(1).',
                   'solutions': {'python': 'n = int(input())\n'
                                           'a, b = 0, 1\n'
                                           'for _ in range(n):\n'
                                           '    a, b = b, a + b\n'
                                           'print(a)'}},
 'second-largest': {'approach': 'Remove duplicates, then sort, and take the second value from the end. '
                                'Removing duplicates matters because the second largest must be a different '
                                'value from the largest.',
                    'hints': ['set() removes duplicate values.',
                              'After sorting, the last item is the largest and the one before it is the '
                              'second largest.'],
                    'complexity': 'Time O(n log n), space O(n). A single pass keeping two variables gives '
                                  'O(n).',
                    'solutions': {'python': 'n = int(input())\n'
                                            'values = sorted(set(map(int, input().split())))\n'
                                            'print(values[-2])'}},
 'reverse-words': {'approach': 'Split the line into words, reverse the list of words, and join them back '
                               'with single spaces.',
                   'hints': ['split() with no argument splits on spaces.',
                             'Reverse the list, not the letters.'],
                   'complexity': 'Time O(n), space O(n).',
                   'solutions': {'python': 'words = input().split()\nprint(" ".join(reversed(words)))'}},
 'valid-parentheses': {'approach': 'Use a stack. Push every opening bracket. When you see a closing bracket, '
                                   'the top of the stack must be its matching opening bracket, otherwise the '
                                   'answer is No. At the end the stack must be empty.',
                       'hints': ['A stack is last in, first out: a list with append and pop works.',
                                 'Store the matching opener for each closer in a small dictionary.',
                                 'Do not forget the case where the stack is empty when a closer arrives.'],
                       'complexity': 'Time O(n), space O(n).',
                       'solutions': {'python': 's = input().strip()\n'
                                               'pairs = {")": "(", "]": "[", "}": "{"}\n'
                                               'stack = []\n'
                                               'ok = True\n'
                                               'for c in s:\n'
                                               '    if c in "([{":\n'
                                               '        stack.append(c)\n'
                                               '    elif not stack or stack.pop() != pairs[c]:\n'
                                               '        ok = False\n'
                                               '        break\n'
                                               'print("Yes" if ok and not stack else "No")'}},
 'lis-length': {'approach': 'For every position i, work out the length of the longest increasing subsequence '
                            'that ends at i. Look at every earlier element j that is smaller than a[i], and '
                            'take the best of those plus one. The answer is the largest value found.',
                'hints': ['Start every position with length 1, since one element is already a subsequence.',
                          'Two loops: i over every position, j over the positions before it.',
                          'Only extend from j when a[j] < a[i].'],
                'complexity': 'Time O(n^2), space O(n). A binary search version reaches O(n log n).',
                'solutions': {'python': 'n = int(input())\n'
                                        'a = list(map(int, input().split()))\n'
                                        'best = [1] * n\n'
                                        'for i in range(n):\n'
                                        '    for j in range(i):\n'
                                        '        if a[j] < a[i]:\n'
                                        '            best[i] = max(best[i], best[j] + 1)\n'
                                        'print(max(best))'}},
 'count-primes': {'approach': 'Testing every number one by one is too slow for n up to a million. The Sieve '
                              'of Eratosthenes marks multiples instead: start with every number marked '
                              'prime, then for each prime, cross out its multiples starting from its square.',
                  'hints': ['Make a list of n + 1 True values and set 0 and 1 to False.',
                            'Only loop i up to the square root of n.',
                            'Cross out multiples starting at i * i, stepping by i.',
                            'Count the True values at the end.'],
                  'complexity': 'Time O(n log log n), space O(n).',
                  'solutions': {'python': 'n = int(input())\n'
                                          'if n < 2:\n'
                                          '    print(0)\n'
                                          'else:\n'
                                          '    sieve = [True] * (n + 1)\n'
                                          '    sieve[0] = sieve[1] = False\n'
                                          '    for i in range(2, int(n ** 0.5) + 1):\n'
                                          '        if sieve[i]:\n'
                                          '            for j in range(i * i, n + 1, i):\n'
                                          '                sieve[j] = False\n'
                                          '    print(sum(sieve))'}}}
