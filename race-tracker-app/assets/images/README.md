# Hero Image

To use a custom hero image:

1. Save your Uma Musume image as `uma-hero.jpg` in this directory
2. The CSS will automatically use it as a background image
3. Recommended image size: 1920x1080px (16:9 aspect ratio)

## To enable the image:

Update the HTML in `/race-tracker-app/index.html` line with the hero-banner section to use:
```html
<div class="hero-background" style="background-image: url('assets/images/uma-hero.jpg');"></div>
```

Instead of:
```html
<div class="hero-background"></div>
```

The app currently uses an animated gradient background as a fallback.
