using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BlazorThreeJS.Pages
{
    public partial class Index
    {
        [Inject] IJSRuntime JSRuntime { get; set; }

        ThreeJSPanel.ThreeJSPanel threeJSPanel;

        float[] vertices = new float[]
                {
                    -0.5f, -0.5f, -0.5f,
                    -0.5f, -0.5f,  0.5f,
                    -0.5f,  0.5f, -0.5f,
                    -0.5f,  0.5f,  0.5f,
                     0.5f, -0.5f, -0.5f,
                     0.5f, -0.5f,  0.5f,
                     0.5f,  0.5f, -0.5f,
                     0.5f,  0.5f,  0.5f
                };

        float[] colors = new float[]
                {
                    0.0f, 0.0f, 0.0f,
                    0.0f, 0.0f, 1.0f,
                    0.0f, 1.0f, 0.0f,
                    0.0f, 1.0f, 1.0f,
                    1.0f, 0.0f, 0.0f,
                    1.0f, 0.0f, 1.0f,
                    1.0f, 1.0f, 0.0f,
                    1.0f, 1.0f, 1.0f
                };

        uint[] indices = new uint[]
                {
                    0,2,1, // -x
			        1,2,3,

                    4,5,6, // +x
			        5,7,6,

                    0,1,5, // -y
			        0,5,4,

                    2,6,7, // +y
			        2,7,3,

                    0,4,6, // -z
			        0,6,2,

                    1,3,7, // +z
			        1,7,5,
                };

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            await base.OnAfterRenderAsync(firstRender);
        }
    }
}
