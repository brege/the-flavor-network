# <div align=center> The Flavor Network | [Demo](https://flavorpair.me) </div>

This repository contains the website source code for 
[flavorpair.me](https://flavorpair.me),
a creativity tool that empowers chefs and bartenders to build recipes starting from flavor pairing fundamentals.

![A network graph showing the interconnectivity of Lemon, Basil, and Vanilla with other ingredients](site/content/lemon-basil-vanilla.png)

This is a graphical search tool that provides an interactive network graph connecting ingredients by flavor, through a concensus of flavor pairing relationships obtained from treating the [The Flavor Bible](https://karenandandrew.com/books/the-flavor-bible/) as a dataset.  Prototype recipe ideas from these connections, and some selected recipes from 
[food.com](https://food.com) will display to the side.  This way, you can visually cycle through a near endless commbination of ingredients in an intuitive playground.

## Overview

The website is built with [Hugo](https://gohugo.io), a static site generator, using the 
[papermod theme](https://github.com/adityatelange/hugo-PaperMod/),
which is served through a [nginx](https://nginx) reverse proxy.

The visualization makes use of two main libraries: 

1. [vis.js](https://visjs.org) for visualization of the network graph
2. [fuse.js](https://www.fusejs.io/) for searching through the ingredient space

The network was constructed by creating a dataset out of [The Flavor Bible](https://karenandandrew.com/books/the-flavor-bible/), which is hosted statically on the website via JSON files.
The code to generate this dataset can be found in a companion repository [here](https://github.com/brege/flavor-project). 

The third module is a custom recipe searcher. This uses a dataset constructed from over 200,000 recipes on [food.com](https://food.com) (fmr. genius kitchen), which can be found [on kaggle](https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-user-interactions).

That dataset was turned into a SQLite database (see: [notebooks/csv-to-sql.ipynb](notebooks/csv-to-sql.ipynb)), where a custom WSGI API was built over Flask.
Recipes are dynamically updated as new ingredients are added or removed from the "proto" recipe ingredient list.
In short, all three modules (ingredient search, network visualization, recipe database) are kept in sync with the user's input.

## Developement Server

Hugo has a built in developement server.  In `site/`, run
```bash
hugo server
``` 

This is typically accessible at [http://localhost:1313](http://localhost:1313).

You will need two terminal windows open.  One for the hugo server, and one for the API backend server.

In order to use the recipe API, you'll need to initialize the SQL database.

1. Download [the kaggle dataset](https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-user-interactions) and unpack it into `./notebooks/data/`

2. Run a jupyter notebook server, `jupyter notebook` in `notebooks/`, then load `csv-to-sql.ipynb` and begin running executing the cells.  This can take some time.

3. This will create a `food_dotcom.db` file.  On my production machine, I keep this database file in the same directory as `backend.py`: `/var/www/recipe-api/food_dotcom.db`

4. The API can be started with
    ``` bash
    python backend.py
    ```
    which is what one does locally.  On the production machine https://flavorpair.me, however, the `systemd` service file used is provided in `server/systemd/recipe-api.service` which adds an additional WSGI layer.

## Production Server

1. Much of the deployment of the site is encapsulated in the `deploy` shell script. 
This will build the site files locally via `hugo`, clean the site directory on the remote server, and then transfer the static site files to the remote server. 

2. The remote, as mentioned, also makes use of a `systemd` service file that controls the WSGI/Flask server API.  This is a separate process from hugo.  This only needs to be enabled once (located in `/etc/systemd/system/`):
    ```bash
    sudo systemctl enable recipe-api.service
    ```
    Reload the daemon
    ```bash
    sudo systemctl daemon-reload
    ```
    and start the service
    ```bash
    sudo systemctl start recipe-api.service
    ```
3. What `nginx` does is forwards the local port of the flask API to an outward facing URL path. 
    
    This file is provided in `server/nginx/flavorpair.me` and belongs in `/etc/nginx/sites-available/` and symlinked to `/etc/nginx/sites-enabled`.
`Nginx` is also controlled by systemd.
    Similar to above:
    ```bash
    sudo cp server/nginx/flavorpair.me /etc/ngins/sites-available/
    sudo ln -s  /etc/ngins/sites-available/flavorpair.me /etc/ngins/sites-enabled/flavorpair.me
    sudo systemctl daemon-reload
    sudo systemctl restart nginx
    ```

    The site is secured with [Let's Encrypt](https://letsencrypt.org) via `certbot`'s `nginx plugin`.  These days, this is incredibly easy. Without restarting nginx: `sudo certbot --nginx -d flavorpair.me`.

### Hugo and Javascript

The way you develop javascript on top of a hugo site is usually done through shortcodes and partials. 
One word of caution here is that there is inherently two different variable declarations happening in such javascript, as often times you need to have hugo translate a local path to a relative URL or vice versa. 
One handy trick is to pass paths through HTML tag attributes within shortcodes.
The syntax can admittedly be confusing even to experienced hugo users.



