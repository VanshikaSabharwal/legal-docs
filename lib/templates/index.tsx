import React from "react";
import { GoLaw } from "react-icons/go";

import bnss144 from "./bnss-144";
import hma13 from "./hma-13";
import hma13b from "./hma-13b";

export interface Template {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: string;
}

export const TEMPLATES: Record<string, Template> = {
  "bnss-144": {
    title: "धारा 144 BNSS",
    subtitle: "भरण-पोषण आवेदन · Maintenance",
    icon: <GoLaw size={24} />,
    content: bnss144,
  },

  "hma-13": {
    title: "धारा 13 HMA",
    subtitle: "तलाक याचिका · Divorce Petition",
    icon: <GoLaw size={24} />,
    content: hma13,
  },

  "hma-13b": {
    title: "धारा 13B HMA",
    subtitle: "आपसी सहमति तलाक · Mutual Divorce",
    icon: <GoLaw size={24} />,
    content: hma13b,
  },

  new: {
    title: "नया दस्तावेज़",
    subtitle: "Blank document",
    icon: <GoLaw size={24} />,
    content: "",
  },
};