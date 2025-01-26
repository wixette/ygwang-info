#!/usr/bin/env python3

import os
import re

POEM_DIR = '../content/poems'
POEM_FILE_PATTERN = r'^poem_(.*).md$'
POEM_AUTHOR_LINE = 'author = \'王咏刚\''

def main():
    '''Traverse all poem files, check if there is already an author line. If
    not, add one right after the "+++" line.'''
    for poem_file in os.listdir(POEM_DIR):
        if re.match(POEM_FILE_PATTERN, poem_file):
            poem_path = os.path.join(POEM_DIR, poem_file)
            with open(poem_path, 'r') as f:
                lines = f.readlines()
                if lines[0].strip() != '+++':
                    print(f'Warning: {poem_file} does not start with "+++"')
                if POEM_AUTHOR_LINE + '\n' in lines:
                    print(f'Warning: {poem_file} already has an author line')
                else:
                    lines.insert(1, f'{POEM_AUTHOR_LINE}\n')
                    with open(poem_path, 'w') as f:
                        f.writelines(lines)


if __name__ == '__main__':
    main()
