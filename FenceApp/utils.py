from pathlib import Path
from django.shortcuts import render
from django.http import JsonResponse
from .utils import *
# from flask import Flask, render, request, JsonResponse, send_from_directory
import json
import os
import math
from functools import wraps
from typing import Dict, Any, Callable
import logging
import uuid

import base64


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


BASE_DIR = Path(__file__).parent
PRICING_DIR = BASE_DIR / 'materials'
DATA_DIR = BASE_DIR / 'data'
TEMPLATE_FILE = DATA_DIR / 'templates.json'
PROPOSAL_FILE = DATA_DIR / 'proposals.json'
CUSTOMER_FILE = DATA_DIR / 'customers.json'

COMPANY_INFO_FILE = DATA_DIR / 'company_info.json'
FINANCIALS_FILE = PRICING_DIR / 'financials.json'



def init_data_directories():
    """Initialize all required data directories"""
    DATA_DIR.mkdir(exist_ok=True)
    PRICING_DIR.mkdir(exist_ok=True)


def load_company_info():
    if os.path.exists(COMPANY_INFO_FILE):
        with open(COMPANY_INFO_FILE, 'r') as f:
            return json.load(f)
    return {
        "name": "",
        "address": "",
        "phone": "",
        "email": "",
        "logo": "",
        "website": ""
    }


def save_company_info(info):
    with open(COMPANY_INFO_FILE, 'w') as f:
        json.dump(info, f, indent=2)


def load_financials():
    if os.path.exists(FINANCIALS_FILE):
        with open(FINANCIALS_FILE, 'r') as f:
            return json.load(f)
    return {
        "laborRates": {
            "chain_link": {},
            "iron_fence": {},
            "wood_privacy": {}
        },
        "overheadRates": {
            "profitMargin": 0.77,
            "taxRate": 0.08,
            "wasteFactor": 1.1
        }
    }


def save_financials(data):
    with open(FINANCIALS_FILE, 'w') as f:
        json.dump(data, f, indent=2)


def init_template_file():
    try:
        DATA_DIR.mkdir(exist_ok=True)
        PRICING_DIR.mkdir(exist_ok=True)

        if not TEMPLATE_FILE.exists():
            TEMPLATE_FILE.write_text('{}')
            os.chmod(TEMPLATE_FILE, 0o666)
            logger.info(f"Created template file at {TEMPLATE_FILE}")
    except Exception as e:
        logger.error(f"Error initializing template file: {e}")


def handle_errors(f: Callable) -> Callable:
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except FileNotFoundError as e:
            logger.error(f"File not found error: {e}")
            return JsonResponse({"error": "Required data file not found"}, status=404)
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            return JsonResponse({"error": "Invalid JSON data"}, status=400)
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return JsonResponse({"error": "An unexpected error occurred"}, status=500)

    return decorated_function


def load_json_file(filename: str) -> Dict[str, Any]:
    file_path = PRICING_DIR / filename
    with open(file_path, 'r') as f:
        return json.load(f)


def save_json_file(filename: str, data: Dict[str, Any]) -> None:
    file_path = PRICING_DIR / filename
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)


def load_proposals():
    if os.path.exists(PROPOSAL_FILE):
        with open(PROPOSAL_FILE, 'r') as f:
            return json.load(f)
    return {}


def save_proposals(proposals):
    with open(PROPOSAL_FILE, 'w') as f:
        json.dump(proposals, f, indent=2)


def load_customers():
    if os.path.exists(CUSTOMER_FILE):
        with open(CUSTOMER_FILE, 'r') as f:
            return json.load(f)
    return {}


def save_customers(customers):
    with open(CUSTOMER_FILE, 'w') as f:
        json.dump(customers, f, indent=2)