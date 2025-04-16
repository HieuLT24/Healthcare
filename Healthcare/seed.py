import os
import django
import random
from datetime import datetime, timedelta
from faker import Faker

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Healthcare.settings")
django.setup()

from HealthcareApp.models import *

fake = Faker()

def run():
    # Xóa dữ liệu cũ (nếu cần)
    User.objects.all().delete()
    MuscleGroup.objects.all().delete()
    Exercise.objects.all().delete()
    WorkoutSession.objects.all().delete()
    Diary.objects.all().delete()
    Reminder.objects.all().delete()
    Conversation.objects.all().delete()
    Message.objects.all().delete()
    FoodItem.objects.all().delete()
    Meal.objects.all().delete()
    NutritionGoal.objects.all().delete()
    NutritionPlan.objects.all().delete()

    # 1. Tạo Users
    users = []
    roles = [role.value for role in Role]
    goals = [goal.value for goal in HealthGoals]
    for _ in range(10):
        user = User.objects.create_user(
            username=fake.user_name(),
            email=fake.email(),
            password='1',
            role=random.choice(roles),
            date_of_birth=fake.date_of_birth(minimum_age=18, maximum_age=40),
            height=round(random.uniform(150, 190), 2),
            weight=round(random.uniform(50, 100), 2),
            health_goals=random.choice(goals),
        )
        users.append(user)

    # 2. Tạo MuscleGroup
    muscles = []
    for _ in range(10):
        mg = MuscleGroup.objects.create(name=fake.word().capitalize())
        muscles.append(mg)

    # 3. Tạo Exercise
    exercises = []
    for _ in range(10):
        ex = Exercise.objects.create(
            name=fake.word().capitalize() + " Exercise",
            description=fake.text(),
            difficulty_level=random.choice(['Easy', 'Medium', 'Hard']),
            equipment=random.choice(['Dumbbell', 'Barbell', 'Mat', 'None']),
            duration=random.randint(5, 30),
            repetition=random.randint(5, 15),
            sets=random.randint(1, 5),
            calories_burned=round(random.uniform(50, 300), 2),
            rating=round(random.uniform(3.0, 5.0), 2)
        )
        ex.muscle_groups.set(random.sample(muscles, k=random.randint(1, 3)))
        exercises.append(ex)

    # 4. Tạo WorkoutSession
    sessions = []
    for _ in range(10):
        session = WorkoutSession.objects.create(
            schedule=datetime.now() + timedelta(days=random.randint(1, 30)),
            name=f"Workout {_ + 1}",
            goal=random.choice(goals),
            total_duration=random.randint(20, 90),
            bpm=random.randint(60, 160),
            steps=random.randint(1000, 5000),
            calories_burned=round(random.uniform(150, 600), 2)
        )
        session.exercise.set(random.sample(exercises, k=random.randint(2, 5)))
        sessions.append(session)

    # 5. Diary
    for _ in range(10):
        Diary.objects.create(
            name=f"Diary {_ + 1}",
            content=fake.text(),
            user=random.choice(users),
            workout_session=random.choice(sessions)
        )

    # 6. Reminder
    types = [t.value for t in ReminderType]
    for _ in range(10):
        Reminder.objects.create(
            name=f"Reminder {_ + 1}",
            description=fake.sentence(),
            time=datetime.now() + timedelta(hours=random.randint(1, 48)),
            repeat=bool(random.getrandbits(1)),
            reminder_type=random.choice(types),
            user=random.choice(users)
        )

    # 7. Conversation
    conversations = []
    for i in range(5):
        u1, u2 = random.sample(users, 2)
        if u1.id < u2.id:
            conv = Conversation.objects.create(name=f"Conversation {u1.id}-{u2.id}", sender_1=u1, sender_2=u2)
            conversations.append(conv)

    # 8. Message
    for _ in range(10):
        conv = random.choice(conversations)
        sender = conv.sender_1
        receiver = conv.sender_2
        Message.objects.create(
            name="Message",
            conversation=conv,
            content=fake.sentence(),
            sender=sender,
            receiver=receiver
        )

    # 9. FoodItems
    food_items = []
    for _ in range(10):
        fi = FoodItem.objects.create(
            name=fake.word().capitalize(),
            calories=round(random.uniform(50, 300), 2),
            proteins=round(random.uniform(5, 30), 2),
            carbs=round(random.uniform(10, 60), 2),
            fats=round(random.uniform(2, 25), 2),
            quantities=random.randint(1, 3),
            unit=random.choice(["g", "ml", "cup", "piece"])
        )
        food_items.append(fi)

    # 10. Meal
    meals = []
    for _ in range(10):
        meal = Meal.objects.create(name=f"Meal {_ + 1}")
        meal.food_items.set(random.sample(food_items, k=random.randint(2, 5)))
        meals.append(meal)

    # 11. NutritionGoal
    for _ in range(10):
        NutritionGoal.objects.create(
            name=f"Nutrition Goal {_ + 1}",
            user=random.choice(users),
            date=datetime.now(),
            daily_calories=round(random.uniform(1500, 2500), 2),
            daily_proteins=round(random.uniform(80, 150), 2),
            daily_carbs=round(random.uniform(150, 300), 2),
            daily_fats=round(random.uniform(40, 90), 2),
        )

    # 12. NutritionPlan
    for _ in range(10):
        np = NutritionPlan.objects.create(
            name=f"Plan {_ + 1}",
            user=random.choice(users),
            date=datetime.now().date(),
            total_calories=round(random.uniform(1500, 2500), 2),
            total_proteins=round(random.uniform(80, 150), 2),
            total_carbs=round(random.uniform(150, 300), 2),
            total_fats=round(random.uniform(40, 90), 2),
        )
        np.meals.set(random.sample(meals, k=random.randint(1, 4)))

    print("✅ Seed dữ liệu hoàn tất.")

if __name__ == '__main__':
    run()
