const PRESET_EXERCISES = [
  // Push (15)
  ["Barbell Bench Press", "push"], ["Incline Barbell Bench Press", "push"],
  ["Decline Barbell Bench Press", "push"], ["Dumbbell Bench Press", "push"],
  ["Incline Dumbbell Press", "push"], ["Push-Up", "push"],
  ["Diamond Push-Up", "push"], ["Wide Push-Up", "push"],
  ["Dumbbell Fly", "push"], ["Cable Fly", "push"],
  ["Machine Chest Press", "push"], ["Chest Dip", "push"],
  ["Floor Press", "push"], ["Landmine Press", "push"], ["Svend Press", "push"],
  // Pull (15)
  ["Pull-Up", "pull"], ["Chin-Up", "pull"], ["Barbell Row", "pull"],
  ["Dumbbell Row", "pull"], ["Seated Cable Row", "pull"],
  ["T-Bar Row", "pull"], ["Lat Pulldown", "pull"], ["Face Pull", "pull"],
  ["Inverted Row", "pull"], ["Pendlay Row", "pull"],
  ["Meadows Row", "pull"], ["Chest-Supported Row", "pull"],
  ["Cable Pullover", "pull"], ["Straight-Arm Pulldown", "pull"], ["Rack Pull", "pull"],
  // Legs (20)
  ["Barbell Back Squat", "legs"], ["Front Squat", "legs"],
  ["Goblet Squat", "legs"], ["Leg Press", "legs"], ["Hack Squat", "legs"],
  ["Romanian Deadlift", "legs"], ["Conventional Deadlift", "legs"],
  ["Sumo Deadlift", "legs"], ["Bulgarian Split Squat", "legs"],
  ["Walking Lunge", "legs"], ["Reverse Lunge", "legs"],
  ["Leg Extension", "legs"], ["Leg Curl", "legs"],
  ["Seated Calf Raise", "legs"], ["Standing Calf Raise", "legs"],
  ["Hip Thrust", "legs"], ["Glute Bridge", "legs"],
  ["Step-Up", "legs"], ["Box Squat", "legs"], ["Good Morning", "legs"],
  // Shoulders (13)
  ["Overhead Press", "shoulders"], ["Dumbbell Shoulder Press", "shoulders"],
  ["Arnold Press", "shoulders"], ["Lateral Raise", "shoulders"],
  ["Front Raise", "shoulders"], ["Reverse Fly", "shoulders"],
  ["Upright Row", "shoulders"], ["Cable Lateral Raise", "shoulders"],
  ["Machine Shoulder Press", "shoulders"], ["Pike Push-Up", "shoulders"],
  ["Barbell Shrug", "shoulders"], ["Dumbbell Shrug", "shoulders"],
  ["Lu Raise", "shoulders"],
  // Arms (14)
  ["Barbell Curl", "arms"], ["Dumbbell Curl", "arms"],
  ["Hammer Curl", "arms"], ["Preacher Curl", "arms"],
  ["Concentration Curl", "arms"], ["Cable Curl", "arms"],
  ["EZ-Bar Curl", "arms"], ["Skull Crusher", "arms"],
  ["Tricep Pushdown", "arms"], ["Overhead Tricep Extension", "arms"],
  ["Close-Grip Bench Press", "arms"], ["Tricep Kickback", "arms"],
  ["Spider Curl", "arms"], ["Tricep Dip", "arms"],
  // Core (13)
  ["Crunch", "core"], ["Plank", "core"], ["Russian Twist", "core"],
  ["Hanging Leg Raise", "core"], ["Lying Leg Raise", "core"],
  ["Bicycle Crunch", "core"], ["Mountain Climber", "core"],
  ["Ab Rollout", "core"], ["Cable Crunch", "core"],
  ["Dead Bug", "core"], ["V-Up", "core"],
  ["Side Plank", "core"], ["Pallof Press", "core"],
  // Cardio (5)
  ["Treadmill Running", "cardio"], ["Stationary Bike", "cardio"],
  ["Rowing Machine", "cardio"], ["Jump Rope", "cardio"], ["Stair Climber", "cardio"],
  // Full Body (5)
  ["Burpee", "fullBody"], ["Kettlebell Swing", "fullBody"],
  ["Clean and Press", "fullBody"], ["Thruster", "fullBody"],
  ["Turkish Get-Up", "fullBody"],
];

function seedExercises(db) {
  const count = db.prepare("SELECT COUNT(*) as c FROM exercises WHERE is_custom = 0").get();
  if (count.c > 0) return;

  const insert = db.prepare("INSERT OR IGNORE INTO exercises (name, category, is_custom) VALUES (?, ?, 0)");
  const tx = db.transaction(() => {
    for (const [name, category] of PRESET_EXERCISES) {
      insert.run(name, category);
    }
  });
  tx();
  console.log(`Seeded ${PRESET_EXERCISES.length} preset exercises`);
}

module.exports = { seedExercises };
