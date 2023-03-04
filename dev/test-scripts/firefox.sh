#!/bin/bash

firefox \
  --headless \
  --browser \
  --disable-gpu \
  --window-size=1440,900 \
  --profile /tmp/profile \
  http://localhost:7357/
