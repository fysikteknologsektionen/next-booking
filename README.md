# booking

Room booking application for The Physics Division at Chalmers University of Technology.

## Requirements

- VS Code with Devcontainer plugin
- Docker

# Getting started

## Getting the Devcontainer Up and Running
In order to get the development container up and running you should have the [Remote Development extension pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) installed in Visual Studio Code. You also need to have Docker installed on your system.

When developing on Windows it is recommended that you clone the project directly into a volume using the Visual Studio Code option "Clone Repository in Container Volume...". This keeps WSL2 from slowing down the build by having to access the local Windows filesystem.

On Linux systems you can clone it locally and start the container by using the "Reopen in container" option.


## Initializing the project 
Open a terminal in the container and do the following
- Create an .env file from .env.example
- Install all the node packages by running `npm install`
- Initiate and seed the database with `npx prisma migrate dev --name init`
- Start the server with `npm run dev`

In order to reset the database to the seeded state run `npx prisma migrate reset`