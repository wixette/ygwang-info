#!/usr/bin/python


import codecs
import sys

_DEFAULT_AUTHOR = u'\u738b\u548f\u521a'

_STATE_WAITING_FOR_TITLE = 0
_STATE_WAITING_FOR_DATE = 1
_STATE_WAITING_FOR_NOTES_OR_CONTENTS = 2
_STATE_IN_NOTES = 3
_STATE_IN_CONTENTS = 4

_FULL_WIDTH_SPACE = u'\u3000'
_NBSP = u'\u00A0'


def _NormalizeSpaces(line):
  """Normalizes spaces in a plain-text line..
     1) Replaces ASCII space pair '\u0020\u0020' with CJK space '\u3000'.
     2) Replaces single ASCII space '\u0020' with one NBSP '\u00A0'.
  """
  return line.replace(u'  ', _FULL_WIDTH_SPACE).replace(u' ', _NBSP)


def FormatPoem(poem_file):
  """Accepts plain text format, converts it to HTML block.

     Expected input format:

     Title
     [Author/]Date
     [\[Notes/Comments\]]
     Contents

     Sample output:

     <p class="poem-title">Title
     <p class="poem-info">Author/Date
     <p class="poem-note">Notes/Comments
     <p class="poem-content">Content
     <p class="poem-content">...
  """

  state = _STATE_WAITING_FOR_TITLE
  title = ''
  info = ''
  notes = []
  para_of_notes = ''
  contents = []

  for line in codecs.open(poem_file, 'r', 'utf-8'):
    # Only strips trailing spaces. Leading spaces matter for poems.
    line = line.rstrip()

    if state == _STATE_WAITING_FOR_TITLE:
      if line.strip():
        title = _NormalizeSpaces(line.strip())
        state = _STATE_WAITING_FOR_DATE
    elif state == _STATE_WAITING_FOR_DATE:
      line = line.strip()
      if line:
        fields = line.split(u'/')
        if len(fields) == 1:
          author = _DEFAULT_AUTHOR
          date = fields[0]
        else:
          author = _NormalizeSpaces(fields[0].strip())
          date = fields[1]
        info = u'%s%s%s' % (author, _FULL_WIDTH_SPACE, date)
        state = _STATE_WAITING_FOR_NOTES_OR_CONTENTS
    elif state == _STATE_WAITING_FOR_NOTES_OR_CONTENTS:
      if line.strip().startswith(u'['):
        rest = line.strip()[1:].strip()
        if rest.endswith(u']'):
          rest = rest[:-1]
          notes.append(_NormalizeSpaces(rest))
          state = _STATE_IN_CONTENTS
        else:
          if rest:
            para_of_notes = _NormalizeSpaces(rest)
          state = _STATE_IN_NOTES
      elif line.strip():
        contents.append(_NormalizeSpaces(line))
        state = _STATE_IN_CONTENTS
    elif state == _STATE_IN_NOTES:
      line = line.strip()
      if line.endswith(u']'):
        line = line[:-1]
        if line:
          para_of_notes += line
        if para_of_notes:
          notes.append(para_of_notes)
        state = _STATE_IN_CONTENTS
      else:
        if line:
          para_of_notes += line
        else:
          if para_of_notes:
            notes.append(para_of_notes)
            para_of_notes = ''
    elif state == _STATE_IN_CONTENTS:
      contents.append(_NormalizeSpaces(line))

  print title
  print info
  print notes
  print '\n'.join(notes)
  print contents
  print '\n'.join(contents)

  return u''


if __name__ == '__main__':
  if len(sys.argv) != 2:
    print 'usage: %s <poem_file>'
    sys.exit(1)

  # If run as a standalone app, reads file then outputs to stdout.
  html_piece = FormatPoem(sys.argv[1])
  print html_piece.encode('utf-8')
