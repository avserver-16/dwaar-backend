# Fast Spatial Building Search using OpenStreetMap (.pbf)

## Overview

This project extracts building coordinates from an OpenStreetMap `.pbf` file and creates a very fast spatial search system using `BallTree`.

The goal is to:

- Extract buildings only
- Store building coordinates efficiently
- Perform ultra-fast nearby searches using latitude & longitude
- Find all buildings within a given radius (meters)

---

# Workflow

## Step 1 — Extract Building Coordinates

We parse the `.osm.pbf` file using `osmium`.

Only map objects tagged with:

```text
building=*