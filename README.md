# Timetable Generator

A web-based timetable generator that creates optimized class schedules with support for lab sessions and teacher assignments.

## Features

- Multiple class timetable generation
- Support for lab sessions (3 consecutive periods)
- Teacher assignment and availability tracking
- Flexible working days configuration
- Customizable periods per day
- Modern and responsive web interface

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd timetable-generator
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python app.py
```

5. Open your browser and navigate to:
```
http://localhost:5000
```

## Usage

1. Set the number of periods per day (default: 6)
2. Select working days
3. Add classes and their subjects:
   - Enter class name
   - Add subjects with required hours
   - Mark subjects as lab subjects if needed (will be scheduled in 3 consecutive periods)
4. Add teachers and their subjects
5. Click "Generate Timetable" to create the schedules

## Constraints

- Lab sessions are scheduled in 3 consecutive periods (either periods 1-2-3 or 4-5-6)
- Teachers cannot be assigned to multiple classes at the same time
- Each subject can only be scheduled once per day per class
- The system will attempt to generate a valid timetable up to 100 times before giving up

## Technical Details

- Built with Flask (Python)
- Modern UI with vanilla JavaScript
- Responsive design with CSS Grid and Flexbox
- RESTful API for timetable generation 