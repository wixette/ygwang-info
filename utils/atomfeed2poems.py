#!/usr/bin/python
# -*- coding: utf-8 -*-


import codecs
import datetime
import os
import re
import sys





def parse_poem(file_name):
  f = codecs.open(file_name, 'r', 'utf_8')
  re_entry = re.compile('<entry>')
  re_title = re.compile('<title>(.*)</title>')
  re_updated = re.compile('<updated>([0-9]{4}-[0-9]{2}-[0-9]{2})</updated>')
  re_pre = re.compile('<pre>')
  re_slash_pre = re.compile('</pre>')

  # 0 - out of entry
  # 1 - inside entry, before title
  # 2 - inside entry, before updated
  # 3 - inside entry, before <pre>
  # 4 - inside entry, before </pre>
  state = 0

  title = None
  date = None
  poem = ''

  for line in f:
    if state == 0:
      if re_entry.search(line):
        state = 1
    elif state == 1:
      mo = re_title.search(line)
      if mo:
        title = mo.group(1)
        state = 2
    elif state == 2:
      mo = re_updated.search(line)
      if mo:
        date = mo.group(1)
        state = 3
    elif state == 3:
      if re_pre.search(line):
        state = 4
    elif state == 4:
      if re_slash_pre.search(line):
        yield (title, date, poem)
        title = None
        date = None
        poem = ''
        state = 0
      else:
        poem += line

  if title:
    raise 'input format error'


def main():
  if len(sys.argv) < 3:
    print 'Usage: %s <input_xml> <output_dir>' % sys.argv[0]
    sys.exit(1)

  poems = []
  for title, date, poem in parse_poem(sys.argv[1]):
    poems.append( (title, date, poem) )

  poems.sort(lambda x, y: cmp(x[1], y[1]))

  for index, (title, date, poem) in enumerate(poems):
    output_file = codecs.open(
        os.path.join(sys.argv[2], '%04d.txt' % index),'w', 'utf_8')
    output_file.write('%s\n' % title)
    output_file.write('%s\n' % date)
    output_file.write(poem)


if __name__ == '__main__':
  main()
