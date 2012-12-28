#!/usr/bin/python
# -*- coding: utf-8 -*-

import codecs
import os
import sys
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

def LoadRhymes(file_path):
  f = codecs.open(file_path, 'r', 'utf_8')
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

def LoadPhrases(file_path):
  f = codecs.open(file_path, 'r', 'utf_8')
  for line in f:
    line = line.strip()
    if line:
      char, poetry_phrases = line.split('\t')
      phrases[char] = poetry_phrases

def GenIndex(file_path):
  f = codecs.open(file_path, 'w', 'utf_8')
  f.write(u'{\n')
  f.write(u'"RHYMES_LIST":[\n')
  for i, rhyme_name in enumerate(rhymes_list):
    if i > 0:
      f.write(u',\n')
    f.write(u'"%s"' % rhyme_name)
  f.write(u'],\n')

  f.write(u'"RHYMES_ID_MAPPING":{\n')
  sizes = [0, 15, 15, 29, 30, 17]
  i = 1
  j = 1
  for rhyme_name in rhymes_list:
    if i > 1 or j > 1:
      f.write(u',\n')
    f.write(u'"%d_%d":"%s"' % (i, j, rhyme_name))
    j += 1
    if j > sizes[i]:
      j = 1
      i += 1
  f.write(u'},\n')

  f.write(u'"RHYMES_NAME_MAPPING":{\n')
  sizes = [0, 15, 15, 29, 30, 17]
  i = 1
  j = 1
  for rhyme_name in rhymes_list:
    if i > 1 or j > 1:
      f.write(u',\n')
    f.write(u'"%s":[%d,%d]' % (rhyme_name, i, j))
    j += 1
    if j > sizes[i]:
      j = 1
      i += 1
  f.write(u'},\n')

  f.write(u'"RHYMES_TABLE":{\n')
  for i, rhyme_name in enumerate(rhymes_list):
    char_string = ''
    for char, notes in rhymes[rhyme_name]:
      char_string += \
        '<span class=ch>%s</span>' % char
      if notes:
        char_string += '%s,' % notes.replace('"', '\\\"')
      else:
        char_string += ','
    if i > 0:
      f.write(u',\n')
    f.write(u'"%s":"%s"' % (rhyme_name, char_string[:-1]))
  f.write(u'},\n')

  f.write(u'"POETRY_INDEX":{\n')
  keys1 = set(phrases.keys())
  keys2 = set(char_index.keys())
  keys = list(keys1 | keys2)
  keys.sort()
  for i, char in enumerate(keys):
    rhyme_name_string = u'N/A'
    phrase_string = u'N/A'
    if char in char_index:
      rhyme_name_string = ''
      for rhyme_name, notes in char_index[char]:
        rhyme_name_string += '%s,' % rhyme_name
      rhyme_name_string = rhyme_name_string[:-1]
    if char in phrases:
      phrase_string = phrases[char]
    if i > 0:
      f.write(u',\n')
    s = u'"%s":["%s","%s"]' % (char, rhyme_name_string, phrase_string)
    f.write(s.replace('"N/A"', 'null'))
  f.write(u'}\n')

  f.write(u'}\n')


def main():
  src_dir = os.path.split(os.path.realpath(sys.modules['__main__'].__file__))[0]
  parent_dir = os.path.split(src_dir)[0]
  rhymes_path = os.path.join(src_dir, 'psy_merged.txt')
  phrases_path = os.path.join(src_dir, 'poetry_phrases.txt');
  LoadRhymes(rhymes_path)
  LoadPhrases(phrases_path)
  print len(rhymes)
  print len(char_index)
  print len(phrases)
  index_path = os.path.join(parent_dir, 'static', 'rhymes.json')
  GenIndex(index_path)


if __name__ == '__main__':
  main()
