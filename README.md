Sigma Parses SNAP
===

Ingester of SNAP json rdf data for SigmaJS

## Current data format for SigmaJS 1.0.3

### Nodes

{"label":"Cap Nord","x":-693.8167724609375,"y":-305.88018798828125,"id":"532","color":"rgb(0,204,204)","size":6.837328910827637}

| Key     | Type     | Required | Description
|---------|----------|----------|---------------
| label   | string   |     .    |
| x       | float    |     X    |
| y       | float    |     X    |
| id      | string   |     X    |
| color   | css      |     X    |
| size    | float    |     X    |

### Edges

| Key     | Type     | Required | Description    
|---------|----------|----------|-------------------------
| source  | string   |     X    |
| target  | string   |     X    |
| id      | string   |     X    |