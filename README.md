# Autographa Lite    

### Important   
**This repo is now in maintenance mode. No further feature requests would be entertained here. All further development on Autographa-Lite has moved to https://github.com/friendsofagape/autographa-lite. Everyone is strongly encouraged to use the releases from the other repo. However, please do not hesitate to file bugs that you may find here.**

This is a standalone desktop application which hopes to aid and be a friendly companion of the Bible Translator. In essence it is a basic [USFM](http://paratext.org/about/usfm) editor which is capable of import and export of USFM files. It has handy features like color-coded diffs across imported texts for comparison between revisions, search and replace and export to formatted HTML.

## Developer Setup
It is relatively easy to setup the application locally for development.


### Prerequisites
[Node JS 8.2.1](https://nodejs.org/en/blog/release/v8.2.1/)    
[Yarn 1.5.1](https://yarnpkg.com/en/docs/install)

### Mac (tested on MacOS Sierra 10.13.3) and *nix Setup (tested on Ububtu 17.10)
Fork this repository.   
\# Set enivronment variable ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true.   
\# In bash like shell

```% export ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true ```     
```% cd autographa-lite && yarn install ```     
```% npm start```

This should start the application and open up the main screen.

## Contributing
If you'd like to contribute, please fork the repository and make changes as you'd like. Pull requests are warmly welcome.
Please read the [CONTRIBUTE](https://github.com/Bridgeconn/autographa-lite/blob/master/CONTRIBUTE.md) page for details on our code of conduct, and the process for submitting pull requests.

## License
This project is licensed under the liberal MIT License. See [LICENSE](https://github.com/Bridgeconn/autographa-lite/blob/master/LICENSE) for more details.

## Contact
Let us know if face any bugs/problems by opening an issue in GitHub. We'll do our best to be prompt in our response.

## Acknowledgments
* Friends of Agape, for their support and contributions.
