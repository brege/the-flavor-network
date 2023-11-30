---
title: ""
layout: "blank"
summary: >
    This tool allows you to explore the flavor network, a social graph for flavor profiles. The network is based on the [*Flavor Bible*](https://karenandandrew.com/books/the-flavor-bible/), allowing you to visualize and create recipes from good flavor pairings.
authors: 'Wyatt Brege'
cover:
  image: 'lemon-basil-vanilla.png'
  hidden: true
jquery: true
---

{{< columns >}}
{{< column >}}
{{< flavor-network 
  nodesPath="/data/flavor/nodes.json" 
  edgesPath="/data/flavor/edges.json"
  simPath="/data/flavor/similarity.json" >}}
{{< search-plots jsonPath="/data/flavor/nodes.json" >}}
{{< /column >}}
{{< column >}}
{{< recipe-api >}}
{{< /column >}}
{{< /columns >}}

This tool allows you to explore the flavor network, a social graph for flavor profiles.  It's a graphical search tool that helps chefs and bartenders prototype recipes starting just from ingredients, using a concensus of flavor pairings given by [***The Flavor Bible***](https://karenandandrew.com/books/the-flavor-bible/).  Input an ingredient and start navigating through the connections it makes, clicking on suggested items or inputting more into the search bar.

In technical terms, the algorithm employs [Jaccard similarity](https://en.wikipedia.org/wiki/Jaccard_index) to determine not only which items connect with one another through flavor concensus, but all of those who share the same *kinds* of flavor pairings.  If you're the curious type, head over to [this post](https://brege.org/post/the-flavor-network) for a more complete overview of how this all works.

Here, the same core idea is applied, but with the addition of a **recipe module** that allows you to quickly cycle through new recipes[^1] from your ingredient explorations.  This is a great way to discover new dishes, new culinary terms, and navigate cooking at a more elemental level: **flavor**.

Hopefully, this tool will not only reinforce your instincts about what tastes good together, but surprise you about pairings you haven't even dreamed about yet.

Email me, Wyatt Brege, at [wyatt@brege.org](mailto:wyatt@brege.org) with any suggestions, or find me on [Mastodon](https://mastodon.social/@brege) or [Github](https://github.com/brege).


[^1]: This module uses a [kaggle dataset](https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-user-interactions) of over 200k recipes from [food.com](https://food.com).
