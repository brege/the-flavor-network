# Path: /var/www/recipe-api/backend.py
from flask import Flask, request, jsonify
import sqlite3
import ast

from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Function to retrieve top-rated recipes by ingredients
def get_recipes_by_ingredients(database_path, ingredient_names, top_n=3):
    conn = sqlite3.connect(database_path)
    cur = conn.cursor()

    where_clause = ( " AND ".join(["ingredients LIKE '%{}%'"
                                   .format(ingredient_name) for ingredient_name in ingredient_names]) )

    query = f"""
        SELECT id, name, ingredients, weighted_rating
        FROM recipes 
        WHERE {where_clause} 
        GROUP BY id, name, ingredients, weighted_rating
        ORDER BY weighted_rating DESC
        LIMIT ?
    """

    print(query)

    cur.execute(query, (top_n * 2,))
    results = cur.fetchall()
    conn.close()

    print(results)

    exact_match_results = [result for result in results if all(ingredient in ast.literal_eval(result[2]) for ingredient in ingredient_names)]
    
    recipes_json = []
    for result in results:
        recipes_json.append({
            "ID": result[0],
            "RecipeName": result[1],
            "Ingredients": ast.literal_eval(result[2]),  # Assuming ingredient
            "WeightedRating": result[3]
        })

    return recipes_json


# Route to retrieve recipes by ingredients
@app.route('/api/recipe', methods=['GET'])
def get_recipes_by_ingredients_route():
    # Get the ingredient names from the request
    ingredient_names = request.args.get('ingredient_name').split(',')
    ingredient_names = [name.strip() for name in ingredient_names if name.strip() != '']

    # Get the top_n parameter from the request, default to 5
    top_n = int(request.args.get('top_n', 5))

    # Call the function to get the recipes by ingredients
    recipes = get_recipes_by_ingredients('food_dotcom.db', ingredient_names, top_n)
    recipes_json = jsonify(recipes[:top_n])

    return recipes_json


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

