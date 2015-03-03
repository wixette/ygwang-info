#!/usr/bin/python
# -*- coding: utf-8 -*-

"""Generates closure deps file, js/deps.js.
"""

import os
import sys


_CLOSURE_DIR = os.path.join('closure-library', 'closure')
_CLOSURE_THIRD_PARTY_DIR = os.path.join('closure-library',
                                        'third_party', 'closure')
_DEPS_FILE = 'deps.js'
_JS_DIR = 'js'
_DEPSWRITER_COMMAND = ('python %s --root_with_prefix=' +
                       '\"%s ../../../ppzsite/poems_html5_app/js" > %s')


def main():
  src_dir = os.path.split(os.path.realpath(
      sys.modules['__main__'].__file__))[0]
  parent_dir = os.path.dirname(os.path.dirname(src_dir))
  closure_dir = os.path.join(parent_dir, _CLOSURE_DIR)
  js_dir = os.path.join(src_dir, _JS_DIR)
  deps_file = os.path.join(js_dir, _DEPS_FILE)
  depswriter_path = os.path.join(closure_dir,
                                 'bin', 'build', 'depswriter.py')
  cmd = _DEPSWRITER_COMMAND % (depswriter_path, js_dir, deps_file)
  print cmd
  if os.system(cmd):
    sys.exit(1)


if __name__ == '__main__':
  main()
