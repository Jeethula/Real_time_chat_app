"use client";

import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: any) => void;
}

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  return (
    <Picker 
      data={data} 
      onEmojiSelect={onEmojiSelect}
      theme="light"
      set="apple"
      previewPosition="none"
      skinTonePosition="none"
      navPosition="none"
      perLine={8}
      maxFrequentRows={2}
    />
  );
}