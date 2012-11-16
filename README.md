# depget (experimental) - Install private modules from a file share registry

Want to manage your private dependencies but can't wait around for npm to add support? Don't want to go through setting up a replicated npm registry? Don't.

Depget lets you put your npm packages on a file share and reference them from your packages.json file. Depget is a stop-gap hack which requires you to install your private packages separate from other npm packages, but it works.

## Referencing your private modules

First, install depget either globally or as a dependency:

    npm install -g depget

Next, edit your packages.json file and add a `privateDependencies` hash. It tells depget the location of your private repositories and the dependencies you require from them:

    {
      "privateDependencies": {
        "/path/to/private/packages": {
          "my_module": "~0.1.1"
        },
        "/path/to/other/packages": {
          "my_other_module": "~0.1.1"
        }
      }
    }

Finally, ask depget to pull down your modules by executing `depget update`.

## Publishing your private modules

First, set the `registry` setting in your package.json to point at your private repository. Now, whenever you want to publish a new package, just execute the following from your module's root directory:

    depget publish

This will generate an npm package using `npm pack` and copy it up to your registry. That's it. You can pass `--force` if you want depget to overwrite the same version of the package if it has already been pushed up to the registry.
