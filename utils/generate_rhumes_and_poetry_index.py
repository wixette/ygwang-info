#!/usr/bin/python
# -*- coding: utf-8 -*-

import codecs
import urllib

rhymes_list = []
rhymes = {}
char_index = {}
phrases = {}

def IterateOnChar(line):
  """ yield (char, notes) """
  length = len(line)
  i = 0
  while i < length:
    c = line[i]
    if i + 1 >= length:
      yield (c, None)
    elif line[i+1] != '[':
      yield (c, None)
    else:
      j = i
      notes = ''
      while line[j] != ']':
        j += 1
        if j >= length:
          raise "No matched ] found"
        notes += line[j]
      i = j
      yield (c, notes)
    i += 1

def LoadRhymes():
  f = codecs.open('psy_merged.txt', 'r', 'utf_8')
  rhyme_name = None
  for line in f:
    line = line.strip()
    if u'/' in line:
      rhyme_name = line
      rhymes[rhyme_name] = []
      rhymes_list.append(rhyme_name)
    elif line:
      for char, notes in IterateOnChar(line):
        rhymes[rhyme_name].append( (char, notes) )
        if char in char_index:
          char_index[char].append( (rhyme_name, notes) )
        else:
          char_index[char] = [ (rhyme_name, notes) ]

def LoadPhrases():
  f = codecs.open('poetry_phrases.txt', 'r', 'utf_8')
  for line in f:
    line = line.strip()
    if line:
      char, poetry_phrases = line.split('\t')
      phrases[char] = poetry_phrases

def GenRhymeIndex():
  f = codecs.open('rhymes_index.py', 'w', 'utf_8')
  f.write(u'# -*- coding: utf-8 -*-\n')
  f.write(u'RHYMES_LIST = [\n')
  for rhyme_name in rhymes_list:
    f.write(u'u\'%s\',\n' % rhyme_name)
  f.write(u']\n')

  f.write(u'RHYMES_ID_MAPPING = {\n')
  sizes = [0, 15, 15, 29, 30, 17]
  i = 1
  j = 1
  for rhyme_name in rhymes_list:
    f.write(u'(%d, %d): u\'%s\',\n' % (i, j, rhyme_name))
    j += 1
    if j > sizes[i]:
      j = 1
      i += 1
  f.write(u'}\n')

  f.write(u'RHYMES_NAME_MAPPING = {\n')
  sizes = [0, 15, 15, 29, 30, 17]
  i = 1
  j = 1
  for rhyme_name in rhymes_list:
    f.write(u'u\'%s\': (%d, %d),\n' % (rhyme_name, i, j))
    j += 1
    if j > sizes[i]:
      j = 1
      i += 1
  f.write(u'}\n')

  f.write(u'RHYMES_TABLE = {\n')
  for rhyme_name in rhymes_list:
    char_string = ''
    for char, notes in rhymes[rhyme_name]:
      utf8_char = codecs.getencoder('utf_8')(char)[0]
      if notes:
        char_string += \
        '<a href="/helper?q=%s">%s</a><span class=notes>%s</span>, ' % (
            urllib.quote(utf8_char),
            char,
            notes)
      else:
        char_string += '<a href="/helper?q=%s">%s</a>, ' % (
            urllib.quote(utf8_char),
            char)
    f.write(u'u\'%s\': u\'%s\',\n' % (rhyme_name, char_string[:-2]))
  f.write(u'}\n')

def GenPoetryIndex():
  f = codecs.open('poetry_index.py', 'w', 'utf_8')
  f.write(u'# -*- coding: utf-8 -*-\n')
  f.write(u'POETRY_INDEX = {\n')
  keys1 = set(phrases.keys())
  keys2 = set(char_index.keys())
  keys = list(keys1 | keys2)
  keys.sort()
  for char in keys:
    rhyme_name_string = u'N/A'
    phrase_string = u'N/A'
    if char in char_index:
      rhyme_name_string = ''
      for rhyme_name, notes in char_index[char]:
        rhyme_name_string += '%s,' % rhyme_name
      rhyme_name_string = rhyme_name_string[:-1]
    if char in phrases:
      phrase_string = phrases[char]
    if rhyme_name_string != u'N/A' or phrase_string != u'N/A':
      f.write(u'u\'%s\': (u\'%s\', u\'%s\'),\n' % (char,
                                                   rhyme_name_string,
                                                   phrase_string))
  f.write(u'}\n')

if __name__ == '__main__':
  LoadRhymes()
  LoadPhrases()
  print len(rhymes)
  print len(char_index)
  print len(phrases)
  GenRhymeIndex()
  GenPoetryIndex()
