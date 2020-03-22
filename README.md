# Lightweight CMS to render the site pingpingze.com

## Configuration

See config.toml for details.

## Prerequisites

Makes sure all required python libs are installed:

```
pip3 install --user -r requirements.txt
```

Installs `pandoc` to render Markdown files. See
https://pandoc.org/installing.html for detais.

## Usage

Builds the dist dir:

```
./ppzsite.py build
```

Then runs a simple httpserver to debug:

```
./ppzsite.py test
```

Builds the dist dir and make its tarball. The contents under
the dist dir can be copied to web server's root dir directly.

```
./ppzsite.py dist
```
