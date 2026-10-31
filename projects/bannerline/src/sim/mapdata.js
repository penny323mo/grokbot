/**
 * World frame: y up, player home at +z (near the camera), enemy at −z (top of the portrait).
 * Screen-right from the fixed camera is +x. Node ids are the path graph.
 * The classic skirmish is the crossing map. Other maps live beside it as JSON.
 */
import crossing from '../maps/crossing.json' with { type: 'json' };

export const NODES = crossing.nodes;
export const GRAPH = crossing.graph;
export const ZONES = crossing.zones;
export const ROAD = crossing.road;
