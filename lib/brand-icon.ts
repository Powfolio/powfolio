export const FAVICON_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEO0lEQVR42t2XW4hVVRjHf99aZ59z5pw5+8ycuegomFBmEkwGaiViKN0gMwt7yYdAEXrpUYKeeugtonoqX6zASqxIxQuIgliNDCHeJlFRxxl1nIvO9dz33mv1cM5M2m124xmEFiw2e/Httf77W//v/19LAMsDbIoH3EIBEJFKsAhaSXU0MvW51moqpvqYep+uRcIi1VoRBAYstD++mK3rFpErBGzfd57uaz1TMcZYQq5dAfpfONDcMoct65/g5aVxKN5GKU1BN/HdiVF2HjxNfmIUqf69sbY2AESEaCzOujVLeWttGy2RYUYncqAcrLVofNy0S8+4y47DPRw+fg7wUCFBhMiA4t2tL7JlVYRrvX2UTRTHUTA1ueAHAXWOJZ5qorNHs33veS5cuoKIYKcBoYH3/z0DEEukyVmX+Y0RUlGPomcQUUxutVJCYDSFXJaFDSVeXf0I44HL+cs3778KrFW8tiJNY8Ky60yCU0NNpJJ1RFVAENhqEkHEoiMO4wWLzd7khfZkqCILVYaBl+eZtmE2thfoGxO+PeNyq5Qh40axxr8bLloJRhxy+UItdUAzUQLtj/PKo2OsWliks0ez+1QEJ9EI1vyJWBalVC2V0KJE8AIhXyiyuDWgzTV8tqeLnR05kvUJAmNmTwmDwGCNR2umnjHVxgcHfHoHi3zz3koCI5Q9i5KZSXEoJWxIxXHcNJ8c6OfIqW4+fHs57Y199N65QywWBfwZe0EIAIY9v47Tu/8Wi+YnefPZuezruEHr6hiIH1rxZrwFIrD3yEm6Lvexae1DbHi6mTNXhhkpahz9dzImGGP/QswZZ8Bay7y5zWzb/By7TwxgiLD5pYdZ4E4wlOUe47EIge+RSschlqgdCW8Pj3P64iB1dXVEI4q8rykEDkpsNQGCHxgc8ck0N9FxM8On3/+GiKkNCVP19WxY4RILRrCOy089CXyTqzgfIKZMJp3kRr6BL364zqFjZ8GWa1cFnudx8UYWN+JTliKf7zrJsneWENOCsWAS8/jq50G+PnSM7PhIRZxDGFFoAH7gM1pO0D2apFQO2LZpOanoGKIdOs9e5eDxLvr7ByrupoTA2LvcsgYcSCbilDyfUn4UbfP0jxTQWlBKMZHN098/gFM9lgXG1rYMlQhDt0f4eMdR3liZYeuaFPs7rnN9TBONgFJ/LGxnoAnTboGxltbmDFs2rubLowOI0jy/bD4LGgJKnpoqVRGZPSmeyOUJvCKvr1mM9XI85g4yNJxFJ1vu+1oR4kQkeJ7PL6e7SbpNnLvURyaTIe5YtNbs6xxkdCxbOX7NhhRPpjeiLDt/PIbE0lwdjmJsVXKR2fWCSRAVS/bpunCV+qhHg1tHKuEg97d+VcKn6SJiRcQqpapjYp96con9aNsGO6clY0XEaqWm4iZ7qLnDsOhuhosIgr2n3v+pAmxt7gX/89vx72aj2hjF8t27AAAAAElFTkSuQmCC";

function bytesFromB64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}

export function pngIconResponse(): Response {
  return new Response(bytesFromB64(FAVICON_PNG_B64), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}

export function appleIconResponse(): Response {
  return pngIconResponse();
}

export function icoIconResponse(): Response {
  return new Response(bytesFromB64(FAVICON_PNG_B64), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
