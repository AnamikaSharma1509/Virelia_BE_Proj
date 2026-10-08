"""
Generates rich, contextual First-Person Point-of-View (POV) simulation videos
for all 4 scenario environments (8 levels total).
Each video is 10 seconds (150 frames @ 15fps, 640x360 H.264 MP4) depicting
the exact realistic viewpoint of a participant experiencing the situation.
"""
import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio.v3 as iio

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "media"))

def render_interview_frame(frame_idx, total_frames, level):
    w, h = 640, 360
    img = Image.new("RGB", (w, h), (241, 245, 249))
    draw = ImageDraw.Draw(img)

    # 1. Background Office Wall & City Window
    draw.rectangle([0, 0, w, 200], fill=(226, 232, 240)) # Wall
    # City Window on left
    draw.rectangle([40, 20, 180, 150], fill=(186, 230, 253)) # Sky
    for bx, bw, bh in [(50, 25, 90), (80, 35, 110), (120, 25, 80), (150, 20, 95)]:
        draw.rectangle([bx, 150 - bh, bx + bw, 150], fill=(148, 163, 184))
    draw.rectangle([40, 20, 180, 150], outline=(100, 116, 139), width=3)
    draw.line([110, 20, 110, 150], fill=(100, 116, 139), width=2)
    draw.line([40, 85, 180, 85], fill=(100, 116, 139), width=2)

    # Wall Art / Company Logo on right
    draw.rectangle([460, 30, 600, 110], fill=(255, 255, 255), outline=(203, 213, 225), width=2)
    draw.text((480, 50), "GLOBAL TECH", fill=(51, 65, 85))
    draw.text((480, 75), "Interview Panel Room", fill=(100, 116, 139))

    # Potted Plant on far right
    draw.rectangle([590, 120, 620, 160], fill=(180, 83, 9)) # Pot
    draw.ellipse([580, 80, 630, 130], fill=(22, 101, 52))   # Leaves

    # 2. Conference Table (Middle to Foreground)
    table_y = 175
    draw.polygon([(0, h), (0, table_y + 30), (w, table_y + 30), (w, h)], fill=(120, 53, 15)) # Wood front
    draw.polygon([(0, table_y + 30), (50, table_y), (w - 50, table_y), (w, table_y + 30)], fill=(180, 83, 9)) # Table top

    # 3. Two Professional Interviewers Seated Across the Table
    # Natural subtle breathing bob
    bob1 = int(2.5 * math.sin(frame_idx * 0.15))
    bob2 = int(2.0 * math.cos(frame_idx * 0.12))

    # --- Interviewer 1 (Left - Female Professional) ---
    c1_x = 220
    c1_y = 110 + bob1
    # Torso (Blazer)
    draw.rectangle([c1_x - 35, c1_y + 35, c1_x + 35, table_y + 10], fill=(30, 41, 59))
    draw.polygon([(c1_x - 12, c1_y + 35), (c1_x, c1_y + 55), (c1_x + 12, c1_y + 35)], fill=(255, 255, 255)) # Shirt
    # Neck & Head
    draw.rectangle([c1_x - 7, c1_y + 25, c1_x + 7, c1_y + 35], fill=(254, 215, 170))
    draw.ellipse([c1_x - 20, c1_y - 15, c1_x + 20, c1_y + 28], fill=(254, 215, 170)) # Face
    # Hair
    draw.ellipse([c1_x - 24, c1_y - 25, c1_x + 24, c1_y + 10], fill=(69, 26, 3))
    # Eyes & Friendly Smile
    draw.ellipse([c1_x - 10, c1_y + 3, c1_x - 6, c1_y + 7], fill=(15, 23, 42))
    draw.ellipse([c1_x + 6, c1_y + 3, c1_x + 10, c1_y + 7], fill=(15, 23, 42))
    draw.arc([c1_x - 8, c1_y + 10, c1_x + 8, c1_y + 20], start=0, end=180, fill=(15, 23, 42), width=1)
    # Name Tag
    draw.rectangle([c1_x - 25, c1_y + 50, c1_x - 5, c1_y + 60], fill=(255, 255, 255), outline=(148, 163, 184))

    # --- Interviewer 2 (Right - Male Professional) ---
    c2_x = 380
    c2_y = 105 + bob2
    # Torso (Suit & Tie)
    draw.rectangle([c2_x - 40, c2_y + 35, c2_x + 40, table_y + 10], fill=(15, 23, 42))
    draw.polygon([(c2_x - 10, c2_y + 35), (c2_x, c2_y + 55), (c2_x + 10, c2_y + 35)], fill=(255, 255, 255))
    draw.polygon([(c2_x - 4, c2_y + 40), (c2_x + 4, c2_y + 40), (c2_x, c2_y + 65)], fill=(185, 28, 28)) # Red Tie
    # Head & Short Hair
    draw.rectangle([c2_x - 8, c2_y + 25, c2_x + 8, c2_y + 35], fill=(253, 186, 116))
    draw.ellipse([c2_x - 22, c2_y - 12, c2_x + 22, c2_y + 28], fill=(253, 186, 116))
    draw.ellipse([c2_x - 24, c2_y - 25, c2_x + 24, c2_y], fill=(30, 41, 59)) # Hair
    draw.ellipse([c2_x - 10, c2_y + 4, c2_x - 6, c2_y + 8], fill=(15, 23, 42))
    draw.ellipse([c2_x + 6, c2_y + 4, c2_x + 10, c2_y + 8], fill=(15, 23, 42))
    draw.arc([c2_x - 8, c2_y + 12, c2_x + 8, c2_y + 20], start=0, end=180, fill=(15, 23, 42), width=1)
    draw.rectangle([c2_x + 5, c2_y + 50, c2_x + 28, c2_y + 60], fill=(255, 255, 255), outline=(148, 163, 184))

    # 4. Foreground: Candidate's Point-of-View Elements on Table
    # Candidate Notepad & Pen (Bottom Center-Left)
    draw.rectangle([140, 250, 260, 350], fill=(254, 252, 232), outline=(203, 213, 225), width=2)
    for ny in range(270, 340, 15):
        draw.line([155, ny, 245, ny], fill=(226, 232, 240), width=1)
    draw.line([255, 255, 280, 310], fill=(30, 41, 59), width=3) # Pen

    # Water Glass with reflection (Bottom Right)
    draw.rectangle([480, 260, 520, 330], fill=(224, 242, 254), outline=(186, 230, 253), width=2)
    draw.rectangle([483, 285, 517, 327], fill=(147, 197, 253, 180)) # Water

    # Candidate Laptop edge (Bottom Center-Right)
    draw.rectangle([300, 280, 450, 355], fill=(71, 85, 105), outline=(51, 65, 85), width=2)

    # 5. Contextual Subtitle Overlay
    draw.rectangle([40, 320, 600, 352], fill=(15, 23, 42, 220))
    if level == 1:
        txt = "VIEWER PERSPECTIVE: Seated in interview room. Focus on your breathing and steady eye contact."
    else:
        txt = "INTERVIEWER: 'Could you walk us through a recent project you are proud of?' (Pause to respond)"
    draw.text((50, 328), txt, fill=(248, 250, 252))

    return np.array(img)

def render_stage_frame(frame_idx, total_frames, level):
    w, h = 640, 360
    img = Image.new("RGB", (w, h), (15, 23, 42)) # Dim auditorium
    draw = ImageDraw.Draw(img)

    # 1. Warm Spotlight Beam from Top onto Podium
    spotlight_pulse = 10 * math.sin(frame_idx * 0.1)
    draw.polygon([(260 + spotlight_pulse, 0), (380 - spotlight_pulse, 0), (w, 280), (0, 280)], fill=(30, 41, 59))

    # 2. Audience Rows Facing the Speaker (Viewer POV)
    # Draw several rows of listeners looking toward stage
    num_rows = 3 if level == 1 else 5
    for row in range(num_rows):
        row_y = 120 + row * 28
        row_scale = 1.0 + (row * 0.25)
        seats = 7 if level == 1 else 10
        for seat in range(seats):
            sx = int(60 + seat * (520 / seats)) + int(math.sin(seat + frame_idx * 0.05) * 3)
            # Head bobbing slightly
            head_r = int(10 * row_scale)
            head_y = row_y - head_r
            # Shoulders
            draw.ellipse([sx - head_r * 2, head_y + head_r, sx + head_r * 2, head_y + head_r * 3], fill=(30 + row * 10, 41 + row * 8, 59))
            # Head looking at you
            draw.ellipse([sx - head_r, head_y - head_r, sx + head_r, head_y + head_r], fill=(226, 232, 240))
            # Hair
            draw.ellipse([sx - head_r, head_y - head_r, sx + head_r, head_y - head_r // 3], fill=(71, 85, 105))

    # 3. Side Slide Projection Screen (Viewer POV left)
    draw.rectangle([30, 30, 160, 120], fill=(248, 250, 252), outline=(94, 234, 212), width=3)
    draw.text((45, 45), "PRESENTATION", fill=(15, 23, 42))
    draw.text((45, 65), "Section 1: Overview", fill=(13, 148, 136))
    draw.rectangle([45, 85, 145, 100], fill=(204, 251, 241))

    # 4. Foreground: Wooden Speaker Podium & Gooseneck Microphone
    # Speaker Podium Shelf
    draw.polygon([(160, 240), (480, 240), (520, h), (120, h)], fill=(120, 53, 15))
    draw.polygon([(170, 245), (470, 245), (500, h - 10), (140, h - 10)], fill=(69, 26, 3))

    # Speaker Notes on Podium
    draw.rectangle([220, 255, 330, 335], fill=(255, 255, 255), outline=(203, 213, 225))
    draw.text((230, 265), "KEY POINTS:", fill=(15, 23, 42))
    draw.line([230, 285, 310, 285], fill=(148, 163, 184), width=2)
    draw.line([230, 300, 300, 300], fill=(148, 163, 184), width=2)

    # Dynamic Gooseneck Microphone standing on podium
    draw.line([370, 320, 375, 210], fill=(100, 116, 139), width=5) # Stem
    draw.ellipse([365, 195, 385, 215], fill=(15, 23, 42), outline=(148, 163, 184), width=2) # Mic head

    # Subtitle
    draw.rectangle([40, 320, 600, 352], fill=(15, 23, 42, 230))
    if level == 1:
        txt = "VIEWER PERSPECTIVE: At the podium facing seminar room. Settle your gaze on friendly focal points."
    else:
        txt = "AUDITORIUM SIMULATION: 40+ listeners. Remember to breathe between sentences."
    draw.text((50, 328), txt, fill=(248, 250, 252))

    return np.array(img)

def render_heights_frame(frame_idx, total_frames, level):
    w, h = 640, 360
    img = Image.new("RGB", (w, h), (186, 230, 253)) # Sky
    draw = ImageDraw.Draw(img)

    # 1. Distant Blue Horizon & Panoramic City
    draw.rectangle([0, 120, w, 240], fill=(147, 197, 253)) # Distant haze
    # Moving clouds in blue sky
    cloud_offset = int((frame_idx * 1.2) % (w + 100)) - 50
    draw.ellipse([cloud_offset, 30, cloud_offset + 90, 65], fill=(255, 255, 255, 220))
    draw.ellipse([cloud_offset + 30, 20, cloud_offset + 120, 60], fill=(255, 255, 255, 220))

    # Distant high-rise city skyline (Viewed from 35th+ floor)
    skyscrapers = [
        (40, 45, 120), (95, 50, 150), (160, 60, 100), (230, 70, 170),
        (310, 55, 130), (380, 65, 160), (460, 40, 90), (510, 70, 140), (590, 45, 110)
    ]
    for sx, sw, sh in skyscrapers:
        draw.rectangle([sx, 220 - sh, sx + sw, 220], fill=(100, 116, 139))
        # Building windows grid
        for wy in range(220 - sh + 15, 215, 15):
            for wx in range(sx + 8, sx + sw - 8, 12):
                draw.rectangle([wx, wy, wx + 6, wy + 8], fill=(254, 240, 138))

    # Ground Far Below (tiny roads and green patches)
    draw.rectangle([0, 220, w, 260], fill=(74, 222, 128))
    draw.line([0, 240, w, 240], fill=(148, 163, 184), width=3) # Tiny highway far down

    # 2. Foreground: Solid Balcony Platform & Floor Tiles (Participant's Feet Area)
    draw.polygon([(0, 250), (w, 250), (w, h), (0, h)], fill=(203, 213, 225)) # Stone deck
    # Tile perspective lines
    for tx in range(0, w, 70):
        draw.line([tx, 250, tx, h], fill=(148, 163, 184), width=1)
    draw.line([0, 290, w, 290], fill=(148, 163, 184), width=1)

    # 3. Sturdy Stainless Steel & Protective Glass Railing (Right in front of viewer)
    # Glass panel transparency effect
    draw.rectangle([20, 150, w - 20, 250], fill=(224, 242, 254), outline=(147, 197, 253), width=2)
    # Heavy Top Handrail
    draw.rectangle([0, 140, w, 155], fill=(71, 85, 105), outline=(51, 65, 85), width=2)
    # Vertical Steel Support Posts
    for px in [60, 180, 300, 420, 540]:
        draw.rectangle([px, 140, px + 12, 255], fill=(100, 116, 139), outline=(51, 65, 85), width=1)

    # Safety Notice Plate on Railing
    draw.rectangle([270, 165, 370, 185], fill=(255, 255, 255), outline=(71, 85, 105))
    draw.text((280, 170), "SAFETY BARRIER", fill=(15, 23, 42))

    # Subtitle
    draw.rectangle([40, 320, 600, 352], fill=(15, 23, 42, 230))
    if level == 1:
        txt = "VIEWER PERSPECTIVE: Solid balcony platform. Look out toward the distant horizon to stabilize."
    else:
        txt = "OBSERVATION PLATFORM: Full panoramic view. Notice the sturdy safety railing right in front of you."
    draw.text((50, 328), txt, fill=(248, 250, 252))

    return np.array(img)

def render_congested_frame(frame_idx, total_frames, level):
    w, h = 640, 360
    img = Image.new("RGB", (w, h), (248, 250, 252)) # Bright public concourse
    draw = ImageDraw.Draw(img)

    # 1. Modern Architectural Atrium & Ceiling
    draw.polygon([(0, 0), (w, 0), (w - 80, 90), (80, 90)], fill=(226, 232, 240)) # Ceiling
    # Skylight beams
    for lx in range(120, w - 120, 60):
        draw.line([lx, 0, lx + 20, 90], fill=(255, 255, 255), width=4)

    # Concourse Back Wall & Departure/Directory Boards
    draw.rectangle([80, 90, w - 80, 180], fill=(241, 245, 249))
    draw.rectangle([200, 100, 440, 140], fill=(15, 23, 42)) # Large Digital Board
    draw.text((215, 108), "CAMPUS / TRANSIT CONCOURSE", fill=(250, 204, 21))
    draw.text((215, 124), "Track 1-4: Open • North Hall: Clear Way", fill=(255, 255, 255))

    # Clear Green EXIT Signs on Both Sides
    draw.rectangle([90, 105, 160, 130], fill=(22, 101, 52))
    draw.text((105, 112), "EXIT ->", fill=(255, 255, 255))
    draw.rectangle([480, 105, 550, 130], fill=(22, 101, 52))
    draw.text((495, 112), "<- EXIT", fill=(255, 255, 255))

    # 2. Wide Tiled Floor (Walkway)
    draw.polygon([(80, 180), (w - 80, 180), (w, h), (0, h)], fill=(226, 232, 240))
    for fx in range(-50, w + 100, 80):
        draw.line([fx, h, (fx + w) // 3, 180], fill=(203, 213, 225), width=1)

    # 3. People & Commuters Walking across field of view
    num_people = 4 if level == 1 else 7
    for p in range(num_people):
        # Walking movement across screen
        speed = 1.8 + (p * 0.4)
        direction = 1 if p % 2 == 0 else -1
        base_x = (p * 90 + frame_idx * speed * direction) % (w + 120) - 60
        py = 170 + (p * 15)
        scale = 0.8 + (p * 0.12)
        leg_swing = int(math.sin(frame_idx * 0.4 + p) * 6)

        # Silhouette / Person
        p_color = [(30, 41, 59), (51, 65, 85), (71, 85, 105), (100, 116, 139)][p % 4]
        # Legs
        draw.line([base_x - 5, py + int(40 * scale), base_x - 5 + leg_swing, py + int(70 * scale)], fill=p_color, width=int(4 * scale))
        draw.line([base_x + 5, py + int(40 * scale), base_x + 5 - leg_swing, py + int(70 * scale)], fill=p_color, width=int(4 * scale))
        # Torso / Coat
        draw.rectangle([base_x - int(12 * scale), py + int(12 * scale), base_x + int(12 * scale), py + int(45 * scale)], fill=p_color)
        # Head
        draw.ellipse([base_x - int(8 * scale), py - int(8 * scale), base_x + int(8 * scale), py + int(12 * scale)], fill=(253, 186, 116))
        # Backpack / Bag
        draw.rectangle([base_x + int(8 * scale), py + int(15 * scale), base_x + int(16 * scale), py + int(35 * scale)], fill=(15, 23, 42))

    # 4. Foreground: Open Floor in Front of Participant (Plenty of Personal Space)
    draw.polygon([(0, 290), (w, 290), (w, h), (0, h)], fill=(241, 245, 249, 100))

    # Subtitle
    draw.rectangle([40, 320, 600, 352], fill=(15, 23, 42, 230))
    if level == 1:
        txt = "VIEWER PERSPECTIVE: Walking through open public concourse. Move at your own comfortable pace."
    else:
        txt = "BUSY ATRIUM: People moving smoothly. You have open space ahead and clear visible exits."
    draw.text((50, 328), txt, fill=(248, 250, 252))

    return np.array(img)

def generate_video(rel_path, render_fn, level):
    full_path = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    fps = 15
    duration_secs = 10 # 10 full seconds
    total_frames = fps * duration_secs

    frames = []
    for f in range(total_frames):
        frame = render_fn(f, total_frames, level)
        frames.append(frame)

    # Write MP4 H.264
    iio.imwrite(full_path, frames, fps=fps, codec="libx264")
    print(f"[OK] Generated POV Video: {full_path} ({os.path.getsize(full_path)} bytes, {duration_secs}s)")

def main():
    print("Rendering 8 realistic First-Person POV scenario videos...")
    generate_video("scenarios/interview/interview_level_1.mp4", render_interview_frame, 1)
    generate_video("scenarios/interview/interview_level_2.mp4", render_interview_frame, 2)
    generate_video("scenarios/stage/stage_level_1.mp4", render_stage_frame, 1)
    generate_video("scenarios/stage/stage_level_2.mp4", render_stage_frame, 2)
    generate_video("scenarios/heights/heights_level_1.mp4", render_heights_frame, 1)
    generate_video("scenarios/heights/heights_level_2.mp4", render_heights_frame, 2)
    generate_video("scenarios/congested_spaces/congested_spaces_level_1.mp4", render_congested_frame, 1)
    generate_video("scenarios/congested_spaces/congested_spaces_level_2.mp4", render_congested_frame, 2)
    print("All 8 POV simulation videos successfully rendered.")

if __name__ == "__main__":
    main()
