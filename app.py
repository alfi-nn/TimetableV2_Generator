from flask import Flask, render_template, request, jsonify, redirect, url_for
import random
from typing import Dict, List, Set, Tuple
from collections import defaultdict
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# Create templates directory if it doesn't exist
TEMPLATES_DIR = 'templates_data'
if not os.path.exists(TEMPLATES_DIR):
    os.makedirs(TEMPLATES_DIR)

class TimeTableGenerator:
    def __init__(self, user_input):
        self.periods_per_day = int(user_input.get('periods_per_day', 6))
        self.days = user_input.get('days', ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
        self.class_subjects = user_input.get('class_subjects', {})
        self.teachers = user_input.get('teachers', {})
        self.teacher_schedule = defaultdict(lambda: defaultdict(set))
        self.class_teacher_assignments = defaultdict(dict)

    # ... (Rest of the TimeTableGenerator class methods remain the same)
    def initialize_empty_timetables(self) -> Dict:
        """Initialize empty timetables for all classes."""
        return {
            class_name: {day: ["Unassigned" for _ in range(self.periods_per_day)]
                        for day in self.days}
            for class_name in self.class_subjects.keys()
        }

    def is_lab_subject(self, subject: str, class_name: str = None) -> bool:
        """Check if a subject is a lab subject."""
        if class_name:
            subject_info = self.class_subjects[class_name].get(subject)
        else:
            subject_info = self.class_subjects[list(self.class_subjects.keys())[0]].get(subject)
        return isinstance(subject_info, dict) and "consecutive" in subject_info

    def get_subject_hours(self, subject: str, class_name: str) -> int:
        """Get required hours for a subject."""
        subject_info = self.class_subjects[class_name].get(subject)
        if isinstance(subject_info, dict):
            return subject_info["hours"]
        return subject_info

    def get_consecutive_periods(self, subject: str, class_name: str) -> int:
        """Get required consecutive periods for a subject (if it's a lab)."""
        subject_info = self.class_subjects[class_name].get(subject)
        if isinstance(subject_info, dict):
            return subject_info.get("consecutive", 1)
        return 1

    def get_available_teachers(self, subject: str, day: str, period: int,
                             class_name: str) -> List[str]:
        """Get list of teachers available for a subject at given time."""
        available_teachers = []

        for teacher, subjects in self.teachers.items():
            if subject in subjects:
                if (class_name in self.class_teacher_assignments and
                    subject in self.class_teacher_assignments[class_name] and
                    self.class_teacher_assignments[class_name][subject] != teacher):
                    continue

                is_available = True
                if teacher in self.teacher_schedule[day][period]:
                    is_available = False

                if is_available:
                    available_teachers.append(teacher)

        return available_teachers

    def assign_teacher(self, teacher: str, day: str, period: int,
                      class_name: str, subject: str):
        """Assign a teacher to a specific period and subject."""
        self.teacher_schedule[day][period].add(teacher)
        self.class_teacher_assignments[class_name][subject] = teacher

    def can_schedule_subject(self, subject: str, day: str, timetable: Dict) -> bool:
        """Check if a subject can be scheduled on a given day."""
        return subject not in timetable[day]

    def count_subject_hours(self, subject: str, timetable: Dict) -> int:
        """Count scheduled hours for a subject."""
        return sum(day.count(subject) for day in timetable.values())

    def find_consecutive_slots(self, timetable: Dict, day: str,
                             required_slots: int) -> List[int]:
        """Find available consecutive slots in a day, specifically for periods 1-2-3 or 4-5-6."""
        if required_slots == 3:  # For lab sessions
            possible_starts = [0, 3]  # Only allow starting at period 0 (1-2-3) or period 3 (4-5-6)
            available_slots = []

            for start in possible_starts:
                slots = range(start, start + required_slots)
                if all(timetable[day][slot] == "Unassigned" for slot in slots):
                    available_slots.append(start)
            return available_slots
        else:
            available_slots = []
            for i in range(self.periods_per_day - required_slots + 1):
                slots = range(i, i + required_slots)
                if all(timetable[day][slot] == "Unassigned" for slot in slots):
                    available_slots.append(i)
            return available_slots

    def schedule_lab_session(self, timetable: Dict, class_name: str,
                           lab_subject: str) -> Tuple[bool, Dict]:
        """Schedule a lab session with consecutive periods (1-2-3 or 4-5-6 only)."""
        consecutive_periods = self.get_consecutive_periods(lab_subject, class_name)
        total_hours = self.get_subject_hours(lab_subject, class_name)
        sessions_needed = total_hours // consecutive_periods

        for _ in range(sessions_needed):
            session_scheduled = False
            available_days = random.sample(self.days, len(self.days))

            for day in available_days:
                if session_scheduled:
                    break

                available_slots = self.find_consecutive_slots(timetable, day, consecutive_periods)
                if not available_slots:
                    continue

                start_period = random.choice(available_slots)
                available_teachers = self.get_available_teachers(
                    lab_subject, day, start_period, class_name)

                # Check teacher availability for all consecutive periods
                valid_teachers = []
                for teacher in available_teachers:
                    teacher_available = True
                    for period in range(start_period, start_period + consecutive_periods):
                        if teacher in self.teacher_schedule[day][period]:
                            teacher_available = False
                            break
                    if teacher_available:
                        valid_teachers.append(teacher)

                if valid_teachers:
                    teacher = random.choice(valid_teachers)
                    # Schedule all consecutive periods
                    for period in range(start_period, start_period + consecutive_periods):
                        timetable[day][period] = lab_subject
                        self.assign_teacher(teacher, day, period, class_name, lab_subject)
                    session_scheduled = True

            if not session_scheduled:
                return False, timetable

        return True, timetable

    def generate_timetable(self) -> Dict:
        """Generate weekly timetables with lab hours."""
        max_attempts = 100
        attempt = 0

        while attempt < max_attempts:
            attempt += 1
            timetables = self.initialize_empty_timetables()
            self.teacher_schedule.clear()
            self.class_teacher_assignments.clear()

            scheduling_successful = True

            # First schedule lab sessions for all classes
            for class_name in self.class_subjects.keys():
                lab_subjects = [subject for subject in self.class_subjects[class_name].keys()
                              if self.is_lab_subject(subject, class_name)]

                for lab_subject in lab_subjects:
                    success, timetables[class_name] = self.schedule_lab_session(
                        timetables[class_name], class_name, lab_subject)
                    if not success:
                        scheduling_successful = False
                        break

                if not scheduling_successful:
                    break

            if not scheduling_successful:
                continue

            # Then schedule regular subjects
            for class_name in self.class_subjects.keys():
                regular_subjects = [(subject, hours)
                                  for subject, hours in self.class_subjects[class_name].items()
                                  if not self.is_lab_subject(subject, class_name)]

                subjects_to_schedule = []
                for subject, hours in regular_subjects:
                    subjects_to_schedule.extend([subject] * hours)
                random.shuffle(subjects_to_schedule)

                for subject in subjects_to_schedule:
                    placed = False
                    for day in random.sample(self.days, len(self.days)):
                        if placed:
                            break
                        if not self.can_schedule_subject(subject, day, timetables[class_name]):
                            continue

                        available_slots = [i for i, s in enumerate(timetables[class_name][day])
                                         if s == "Unassigned"]
                        random.shuffle(available_slots)

                        for period in available_slots:
                            available_teachers = self.get_available_teachers(
                                subject, day, period, class_name)
                            if available_teachers:
                                teacher = random.choice(available_teachers)
                                timetables[class_name][day][period] = subject
                                self.assign_teacher(teacher, day, period,
                                                 class_name, subject)
                                placed = True
                                break

                    if not placed:
                        scheduling_successful = False
                        break

                if not scheduling_successful:
                    break

            if scheduling_successful:
                # Fill remaining "Unassigned" slots with "Free"
                for class_name in timetables:
                    for day in self.days:
                        for period in range(self.periods_per_day):
                            if timetables[class_name][day][period] == "Unassigned":
                                timetables[class_name][day][period] = "Free"
                return timetables

        raise Exception("Could not generate valid timetables after maximum attempts")

    def print_timetables(self, timetables: Dict) -> Dict:
        """Generate a formatted representation of timetables."""
        formatted_timetables = {}
        for class_name in timetables.keys():
            formatted_timetable = {
                "table": [],
                "distribution": []
            }
            
            # Generate table
            header = ["Day"] + [f"Period {i+1}" for i in range(self.periods_per_day)]
            formatted_timetable["table"].append(header)
            
            for day in self.days:
                row = [day] + timetables[class_name][day]
                formatted_timetable["table"].append(row)
            
            # Generate distribution
            total_free = sum(day.count("Free") for day in timetables[class_name].values())
            
            for subject in self.class_subjects[class_name]:
                scheduled = self.count_subject_hours(subject, timetables[class_name])
                required = self.get_subject_hours(subject, class_name)
                teacher = self.class_teacher_assignments[class_name].get(subject, "Unassigned")
                
                if self.is_lab_subject(subject, class_name):
                    distribution = f"{subject}: {scheduled}/{required} hours ({scheduled//3} sessions of 3 periods each) (Teacher: {teacher})"
                else:
                    distribution = f"{subject}: {scheduled}/{required} hours (Teacher: {teacher})"
                
                formatted_timetable["distribution"].append(distribution)
            
            formatted_timetable["distribution"].append(f"Free Periods: {total_free} hours")
            
            formatted_timetables[class_name] = formatted_timetable
        
        return formatted_timetables

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generator')
def generator():
    return render_template('generator.html')

@app.route('/templates')
def templates():
    # Get list of saved templates
    template_files = [f for f in os.listdir(TEMPLATES_DIR) if f.endswith('.json')]
    templates = []
    for file in template_files:
        with open(os.path.join(TEMPLATES_DIR, file), 'r') as f:
            template = json.load(f)
            templates.append({
                'name': file[:-5],  # Remove .json extension
                'data': template
            })
    return render_template('templates.html', templates=templates)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/generate_timetable', methods=['POST'])
def generate_timetable():
    user_input = request.json
    print("Received user input:", user_input)
    generator = TimeTableGenerator(user_input)
    try:
        timetables = generator.generate_timetable()
        formatted_timetables = generator.print_timetables(timetables)
        return jsonify(formatted_timetables)
    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 400

@app.route('/save_template', methods=['POST'])
def save_template():
    template_data = request.json
    template_name = template_data.get('name', 'template')
    template_content = template_data.get('content')
    
    if not template_content:
        return jsonify({"error": "No template content provided"}), 400
    
    filename = f"{template_name}.json"
    filepath = os.path.join(TEMPLATES_DIR, filename)
    
    try:
        with open(filepath, 'w') as f:
            json.dump(template_content, f)
        return jsonify({"message": "Template saved successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/load_template/<template_name>')
def load_template(template_name):
    filepath = os.path.join(TEMPLATES_DIR, f"{template_name}.json")
    try:
        with open(filepath, 'r') as f:
            template = json.load(f)
        return jsonify(template)
    except FileNotFoundError:
        return jsonify({"error": "Template not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/delete_template/<template_name>', methods=['DELETE'])
def delete_template(template_name):
    filepath = os.path.join(TEMPLATES_DIR, f"{template_name}.json")
    try:
        os.remove(filepath)
        return jsonify({"message": "Template deleted successfully"})
    except FileNotFoundError:
        return jsonify({"error": "Template not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 