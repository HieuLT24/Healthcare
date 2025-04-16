

def summarize_nutrition(food_items_queryset):
    total_calories = 0
    total_carbs = 0
    total_proteins = 0
    total_fats = 0
    total_quantities = 0

    for item in food_items_queryset:
        total_calories += item.calories
        total_carbs += item.carbs
        total_proteins += item.proteins
        total_fats += item.fats
        total_quantities += item.quantities

    return {
        'calories': round(total_calories, 2),
        'carbs': round(total_carbs, 2),
        'proteins': round(total_proteins, 2),
        'fats': round(total_fats, 2),
        'quantities': round(total_quantities, 2),
    }