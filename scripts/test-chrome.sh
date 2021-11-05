#!/bin/bash

google-chrome \
  --headless \
  --disable-software-rasterizer \
  --disable-gpu-driver-bug-workarounds \
  --disable-gpu-driver-workarounds \
  --disable-gpu-vsync \
  --enable-accelerated-video-decode \
  --enable-features=VaapiVideoDecoder,CanvasOopRasterization \
  --enable-gpu-compositing \
  --enable-gpu-rasterization \
  --enable-native-gpu-memory-buffers \
  --enable-oop-rasterization \
  --use-vulkan-for-webgl \
  --enable-zero-copy \
  --ignore-gpu-blocklist \
  --use-gl=desktop \
  --mute-audio \
  http://localhost:7357
