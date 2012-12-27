

import sqlite3
import codecs
import re


_DB_FILE = 'D:/src/ppzsite2/ppz/db.sqlite3'
_XML_FILE = 'D:/tmp/poems.xml'

key = u''
name = u''
date = u''
text = u''

"""
0 - out of entry
1 - in entry
2 - in pre
"""
state = 0

conn = sqlite3.connect(_DB_FILE)

for line in codecs.open(_XML_FILE, 'r', 'utf_8'):
  origin_line = line
  line = line.strip()
  if u'<entry>' in line:
    state = 1
  elif u'</entry>' in line:
    state = 0
    text.replace(u'\'', u'\'\'')
    conn.execute(u"insert into homepage_poem values(NULL, '%s', '%s', '%s', '%s', '', 'wixette');"
                 % (key, name, date, text))
    conn.commit()
    print key
    print name
    print date
    print text
    print
    key = ''
    name = ''
    date = ''
    text = ''
  elif u'<pre>' in line:
    state = 2
  elif u'</pre>' in line:
    state = 1
  elif state == 2:
    text += origin_line
  elif state == 1:
    matched = re.match(u'<title>(.*)</title>', line)
    if matched:
      name = matched.groups()[0]
    else:
      matched = re.match(u'<updated>(.*)</updated>', line)
      if matched:
        date = matched.groups()[0]
      else:
        matched = re.match(u'<id>.*/(.*)</id>', line)
        if matched:
          key = matched.groups()[0]
