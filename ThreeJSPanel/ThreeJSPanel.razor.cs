using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using Microsoft.JSInterop.WebAssembly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace ThreeJSPanel
{
    public partial class MoleculePanel : ComponentBase, IAsyncDisposable
    {
        private string debug = string.Empty;
        private ElementReference _canvas;

        [Inject] IJSRuntime? JSRuntime { get; set; }
        private IJSUnmarshalledRuntime? UnmarshalledRuntime;

        private IJSObjectReference _module;

        // workaround to get the unmarshalled object reference, only relevant for browser wasm, not webview wasm
        private IJSUnmarshalledObjectReference? GetUnmarshalledModule(IJSObjectReference module)
        {
            if (module is IJSUnmarshalledObjectReference uModule) return uModule;

            var wasm = typeof(WebAssemblyJSRuntime).Assembly;

            if (module != null)
            {

                var moduleId = module.GetType()
                    .GetProperty("Id", BindingFlags.Instance | BindingFlags.NonPublic)!
                    .GetValue(module);

                return wasm!.GetType("Microsoft.JSInterop.WebAssembly.WebAssemblyJSObjectReference")!
                    .GetConstructor(new[] { typeof(WebAssemblyJSRuntime), typeof(long) })!
                    .Invoke(new[] { JSRuntime, moduleId }) as IJSUnmarshalledObjectReference;
            }
            else
                return null;
        }


        public async Task Clicked()
        {
            _module = await JSRuntime!.InvokeAsync<IJSObjectReference>("import", "./_content/MoleculePanel/js/panel.js");
            //var unmarshalledModule = GetUnmarshalledModule(module);  //only for browser wasm, not webview wasm
                        
            // Initialize the js part of the panel.  I'm also sending data about what needs to be rendered, but you should modify 
            // the JS as needed.  This method will also load shaders which are placed in the wwwroot directory.
            var panelID = await _module.InvokeAsync<string>("createPanel", _canvas, 50, 40000*4/3);

            // Load your models here, do any sort of initialization here...
            // My model was generated from PDB files found on https://www.rcsb.org/
            // many lines of text parsed using StringReader and SubStr calls

            // Using "setSlow" which is regular js invoke from dotnet on webview in order to load array data.
            float[] fakeVertices = new float[100];
            await _module.InvokeVoidAsync("setSlow", panelID, "vertices", fakeVertices);

            // // using "setFast" which uses unmarshalled js invoke on a regular browser only, not for webview
            //_ = unmarshalledModule!.InvokeUnmarshalled<string, string, float[], string>("setFast", panelID, "vertices", fakeVertices);

            // Start the rendering
            await _module.InvokeVoidAsync("start", panelID);

        }

        public async ValueTask DisposeAsync()
        {
            if (_module is not null)
            {
                await _module.DisposeAsync();
            }
        }

        

    }
}
