# Personal CMS for the site pingpingze.com

## Configuration

See config.toml for details.

## Usage

Makes sure all required python libs are installed:

```
pip3 install --user -r requirements.txt
```

Installs `pandoc` to render Markdown files. See
https://pandoc.org/installing.html for detais.

Generates the dist dir and runs a simple httpserver for debug:

```
./ppzsite.py test
```

Generates the dist dir and make a tarball for that. The contents under the dist dir can be copied to the root dir of the web server.

```
./ppzsite.py dist
```
