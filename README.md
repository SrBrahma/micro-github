# `micro-github`

# SrBrahma fork:

My Typescript fork with major changes from another fork (https://github.com/zalo/micro-github-1) that updates the repository micro-github (https://github.com/mxstbr/micro-github). It OAuth'enticates GitHub users, retrieving the token to http://localhost:${clientChosenPort}/.

It was made / changed to work with my other project, the https://github.com/SrBrahma/GitHub-Repository-Manager.

Removed the original README as many stuff don't apply anymore. If you are interested in using my code, you should try first the (https://github.com/zalo/micro-github-1) and/or read its README as a knowledge base (or open a previous commit, linked below).


Since 2.0.0, it hardcodes the callback URL to the localhost and requires the client to send the port before. If you want to use a non-localhost callback URL, you may use this previous version / commit: https://github.com/SrBrahma/micro-github/tree/b2e3658b372d7c181665540d639254870b3056cb .


You may create an Issue asking for help or for an update ;)

Only leaving here the original Licence.


## License

Copyright (c) 2017 Maximilian Stoiber, licensed under the MIT license. See [LICENSE.md](LICENSE.md) for more information.
