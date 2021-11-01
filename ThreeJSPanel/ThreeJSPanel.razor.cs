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
    public partial class ThreeJSPanel : ComponentBase, IAsyncDisposable
    {
        [Parameter] public string? VertexShaderSrc { get; set; }
        [Parameter] public string? PixelShaderSrc { get; set; }
        [Parameter] public float[]? Vertices { get; set; }
        [Parameter] public float[]? Colors { get; set; }
        [Parameter] public uint[]? Indices { get; set; }

        private ElementReference _canvas;

        [Inject] IJSRuntime? JSRuntime { get; set; }
        private IJSUnmarshalledRuntime? UnmarshalledRuntime;

        private IJSObjectReference? _module;
        private string? _panelID;

        //// workaround to get the unmarshalled object reference, only relevant for browser wasm, not webview wasm
        //private IJSUnmarshalledObjectReference? GetUnmarshalledModule(IJSObjectReference module)
        //{
        //    if (module is IJSUnmarshalledObjectReference uModule) return uModule;

        //    var wasm = typeof(WebAssemblyJSRuntime).Assembly;

        //    if (module != null)
        //    {

        //        var moduleId = module.GetType()
        //            .GetProperty("Id", BindingFlags.Instance | BindingFlags.NonPublic)!
        //            .GetValue(module);

        //        return wasm!.GetType("Microsoft.JSInterop.WebAssembly.WebAssemblyJSObjectReference")!
        //            .GetConstructor(new[] { typeof(WebAssemblyJSRuntime), typeof(long) })!
        //            .Invoke(new[] { JSRuntime, moduleId }) as IJSUnmarshalledObjectReference;
        //    }
        //    else
        //        return null;
        //}

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                _module = await JSRuntime!.InvokeAsync<IJSObjectReference>("import", "./_content/ThreeJSPanel/js/panel.js");
                _panelID = await _module.InvokeAsync<string>("createPanel", _canvas);
                await _module.InvokeVoidAsync("loadShaders", _panelID, VertexShaderSrc, PixelShaderSrc);
                await _module.InvokeVoidAsync("setSlow", _panelID, "vertices", Vertices);
                // // using "setFast" which uses unmarshalled js invoke on a regular browser only, not for webview
                //_ = unmarshalledModule!.InvokeUnmarshalled<string, string, float[], string>("setFast", panelID, "vertices", fakeVertices);
                await _module.InvokeVoidAsync("setSlow", _panelID, "colors", Colors);
                await _module.InvokeVoidAsync("setSlow", _panelID, "indices", Indices);
                await _module.InvokeVoidAsync("start", _panelID);
            }
            await base.OnAfterRenderAsync(firstRender);
        }

        public async Task LoadShadersAsync(string vertexShaderSrc, string pixelShaderSrc)
        {
            
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
