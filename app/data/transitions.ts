// Transition data for the video editor
export const TRANSITIONS = [
  {
    id: "1",
    kind: "none",
    duration: 0
  },
  {
    id: "2",
    kind: "fade",
    duration: 0.5
  },
  {
    id: "3",
    kind: "slide",
    name: "slide up",
    duration: 0.5,
    direction: "from-bottom"
  },
  {
    id: "4",
    kind: "slide",
    name: "slide down",
    duration: 0.5,
    direction: "from-top"
  },
  {
    id: "5",
    kind: "slide",
    name: "slide left",
    duration: 0.5,
    direction: "from-right"
  },
  {
    id: "6",
    kind: "slide",
    name: "slide right",
    duration: 0.5,
    direction: "from-left"
  },
  {
    id: "7",
    kind: "wipe",
    name: "wipe up",
    duration: 0.5,
    direction: "from-bottom"
  },
  {
    id: "8",
    kind: "wipe",
    name: "wipe down",
    duration: 0.5,
    direction: "from-top"
  },
  {
    id: "9",
    kind: "wipe",
    name: "wipe left",
    duration: 0.5,
    direction: "from-right"
  },
  {
    id: "10",
    kind: "wipe",
    name: "wipe right",
    duration: 0.5,
    direction: "from-left"
  },
  {
    id: "11",
    kind: "flip",
    duration: 0.5
  },
  {
    id: "12",
    kind: "clockWipe",
    duration: 0.5
  },
  {
    id: "13",
    kind: "star",
    duration: 0.5
  },
  {
    id: "14",
    kind: "circle",
    duration: 0.5
  },
  {
    id: "15",
    kind: "rectangle",
    duration: 0.5
  },
  // Additional transitions
  {
    id: "16",
    kind: "zoom",
    name: "zoom in",
    duration: 0.5
  },
  {
    id: "17",
    kind: "zoom",
    name: "zoom out",
    duration: 0.5
  },
  {
    id: "18",
    kind: "blur",
    duration: 0.5
  },
  {
    id: "19",
    kind: "pixelate",
    duration: 0.5
  },
  {
    id: "20",
    kind: "dissolve",
    duration: 0.5
  },
  {
    id: "21",
    kind: "spin",
    duration: 0.5
  },
  {
    id: "22",
    kind: "squeeze",
    name: "squeeze horizontal",
    duration: 0.5,
    direction: "horizontal"
  },
  {
    id: "23",
    kind: "squeeze",
    name: "squeeze vertical", 
    duration: 0.5,
    direction: "vertical"
  },
  {
    id: "24",
    kind: "rotate",
    duration: 0.5
  },
  {
    id: "25",
    kind: "heart",
    duration: 0.5
  },
  {
    id: "26",
    kind: "diamond",
    duration: 0.5
  },
  {
    id: "27",
    kind: "ripple",
    duration: 0.5
  }
];

export type TransitionType = typeof TRANSITIONS[0];