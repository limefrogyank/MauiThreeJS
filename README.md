# MauiThreeJS
Sample project layout for using ThreeJS in a Blazor-Maui project

![image](https://user-images.githubusercontent.com/7821384/139748537-c0efdc08-96fd-4ca3-b531-bc1b1827d47d.png)


Take a look at the JS folder under the ThreeJSPanel project.  It has code that is VERY similar to my old DirectX code.  The other magic is inside the csproj file of the ThreeJSPanel project.  There's a section to kick off the npm compilation before the dotnet build.  You can use either the BlazorThreeJS project or the MauiThreeJS project to start it off.  

This is all **sample** code.  Don't expect it to work for you exactly as-is.  You can add your own parameters to the `ThreeJSPanel` and interact with them your own way inside the panel.ts file.  But this mimics the sample DirectX app when you start a C++/DirectX app using the VS template.

## Why would you want to do this?

I wanted something like the DirectX panel in a UWP app.  The entire UI was written in C#/Xaml (now Blazor) and I had a small graphics display running my DirectX-specific stuff.  This will do exactly that. ThreeJS code is very similar to DirectX (and OpenGL) so you won't find it too hard to convert any existing graphics code.  You can load the models directly with ThreeJS if they're a standard format or do like I do and create all your mesh data in C# and send it over manually.

## Lots to improve

- the panel doesn't react to window size changes
