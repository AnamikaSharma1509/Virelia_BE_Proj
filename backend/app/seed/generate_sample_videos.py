"""
Generates valid H.264 MP4 videos for the 8 scenario slots.
Each video has appropriate resolution (640x360), frame rate (10 fps), duration (4 seconds),
and distinct color grading with visual cues representing the scenario environment.
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio.v3 as iio

VIDEOS = [
    ("scenarios/interview/interview_level_1.mp4", "Interview Practice - Level 1", "Room Familiarization", (30, 41, 59)),
    ("scenarios/interview/interview_level_2.mp4", "Interview Practice - Level 2", "Conversation Simulation", (15, 23, 42)),
    ("scenarios/stage/stage_level_1.mp4", "Stage & Presentation - Level 1", "Small Seminar Room", (31, 38, 135)),
    ("scenarios/stage/stage_level_2.mp4", "Stage & Presentation - Level 2", "Large Auditorium", (49, 46, 129)),
    ("scenarios/heights/heights_level_1.mp4", "Heights Practice - Level 1", "Protected Balcony View", (13, 71, 161)),
    ("scenarios/heights/heights_level_2.mp4", "Heights Practice - Level 2", "Observation Deck Platform", (2, 44, 104)),
    ("scenarios/congested_spaces/congested_spaces_level_1.mp4", "Congested Spaces - Level 1", "Mild Hallway Activity", (19, 78, 74)),
    ("scenarios/congested_spaces/congested_spaces_level_2.mp4", "Congested Spaces - Level 2", "Busy Indoor Setting", (6, 95, 70)),
]

def generate_video(target_rel_path: str, title: str, subtitle: str, bg_color: tuple):
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "media"))
    full_path = os.path.join(base_dir, target_rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)

    width, height = 640, 360
    fps = 10
    total_frames = fps * 4  # 4 seconds

    frames = []
    for i in range(total_frames):
        # Create image frame
        img = Image.new("RGB", (width, height), color=bg_color)
        draw = ImageDraw.Draw(img)

        # Pulse or wave animation effect
        pulse = int(15 * np.sin(2 * np.pi * i / fps))
        accent_color = (
            min(255, bg_color[0] + 50 + pulse),
            min(255, bg_color[1] + 50 + pulse),
            min(255, bg_color[2] + 70 + pulse),
        )

        # Frame border & card
        draw.rectangle([20, 20, width - 20, height - 20], outline=accent_color, width=2)
        draw.rectangle([40, 40, width - 40, height - 40], outline=(100, 116, 139), width=1)

        # Texts
        draw.text((60, 60), "VIRELIA GUIDED SCENARIO", fill=(148, 163, 184))
        draw.text((60, 110), title, fill=(255, 255, 255))
        draw.text((60, 150), subtitle, fill=(203, 213, 225))
        draw.text((60, 210), f"Frame {i+1} / {total_frames}  |  Time: {(i+1)/fps:.1f}s", fill=(148, 163, 184))
        draw.text((60, 280), "[Self-Paced Guided Practice - Non-Diagnostic]", fill=(129, 140, 248))

        # Progress bar
        bar_width = int((width - 120) * ((i + 1) / total_frames))
        draw.rectangle([60, 320, 60 + bar_width, 326], fill=(99, 102, 241))

        frames.append(np.array(img))

    # Write MP4 with H.264 codec
    iio.imwrite(full_path, frames, fps=fps, codec="libx264")
    print(f"[OK] Generated: {full_path} ({os.path.getsize(full_path)} bytes)")

def main():
    print("Generating 8 scenario MP4 video assets...")
    for rel_path, title, subtitle, color in VIDEOS:
        generate_video(rel_path, title, subtitle, color)
    print("All 8 scenario videos successfully generated.")

if __name__ == "__main__":
    main()
