# Assimilator
Assimilator is NodeJS blogging engine with support of markdown.
Built as a [hapijs](https://github.com/hapijs/hapi) plugin but can be used independently.

Assimilator is under slow but constant development.
Documentation will come at some point after tests. 

If you interested in using it in its current state, check [example][example]

##  Features

### Categories
Categories are nothing else than folder names converted to camel case phrases.
For example, if your blog folder contains.
```
./your-blog
    ./first-category
    ./second-category
```
It will become visible to a user as.
- First Category
- Second Category

### Pages
Pages are similar to articles but not listed in the blog. 
If you want to navigate user to a page, you need to create a link to it.

### Projects
Projects are blog web pages independent from main blog.
Note that below uri-s are not the same.
- `your.blog.com/page/` - expected to be a page.
- `your.blog.com/page` - expected to be an article.
Latter one will throw an error if there is no markdown document for it.

### Multi-site support
Assimilator configuration supports multiple sites per server as long as
they all run on the same theme.

#### Themes
Assimilator uses [vision][hapi-vision] plugin currently configured 
to support [handlebars][handlebars] minimal templating.




[example]: https://github.com/indieforger/assimilator/tree/master/demo
[hapi-vision]: https://github.com/hapijs/vision
[handlebars]: http://handlebarsjs.com/