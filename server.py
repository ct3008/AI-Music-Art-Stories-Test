import copy
from flask import Flask, Response, jsonify, render_template, request
import json
import random
from collections import UserString

app = Flask(__name__)

# API Route
@app.route('/')
def homepage():
    return render_template('layout.html')

if __name__ == "__main__":
    app.run(debug=True)