from flask import Flask, render_template, request, jsonify, send_from_directory
import json
import os
import math
from functools import wraps
from typing import Dict, Any, Callable
import logging
import uuid
from pathlib import Path
import base64

app = Flask(__name__,
            static_url_path='/static',
            static_folder='static',
            template_folder='templates'
            )

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


# Add these functions after the existing helper functions
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


# Add these routes after the existing routes
@app.route('/company_settings')
def company_settings():
    company_info = load_company_info()
    financials = load_financials()
    return render_template('company_settings.html',
                           company_info=company_info,
                           financials=financials)


@app.route('/save_company_settings', methods=['POST'])
def save_company_settings():
    try:
        form_data = request.form.to_dict()

        # Handle company info
        company_info = {
            "name": form_data.get('company_name', ''),
            "address": form_data.get('company_address', ''),
            "phone": form_data.get('company_phone', ''),
            "email": form_data.get('company_email', ''),
            "website": form_data.get('company_website', ''),
            "logo": form_data.get('existing_logo', '')  # Preserve existing logo if no new one
        }

        # Handle logo upload
        if 'company_logo' in request.files:
            file = request.files['company_logo']
            if file and file.filename:
                # Convert to base64
                file_content = file.read()
                encoded = base64.b64encode(file_content).decode('utf-8')
                company_info['logo'] = f"data:image/{file.filename.split('.')[-1]};base64,{encoded}"

        # Handle financials
        financials = load_financials()

        # Update labor rates
        for fence_type in ['chain_link', 'iron_fence', 'wood_privacy']:
            for height in ['4', '5', '6', '8']:
                rate_key = f'labor_rate_{fence_type}_{height}'
                if rate_key in form_data and form_data[rate_key]:
                    if height not in financials['laborRates'][fence_type]:
                        financials['laborRates'][fence_type][height] = 0
                    financials['laborRates'][fence_type][height] = float(form_data[rate_key])

        # Update overhead rates
        financials['overheadRates']['profitMargin'] = float(form_data.get('profit_margin', 0.77))
        financials['overheadRates']['taxRate'] = float(form_data.get('tax_rate', 0.08))
        financials['overheadRates']['wasteFactor'] = float(form_data.get('waste_factor', 1.1))

        save_company_info(company_info)
        save_financials(financials)

        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error saving company settings: {e}")
        return jsonify({"error": str(e)}), 500


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
            return jsonify({"error": "Required data file not found"}), 404
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            return jsonify({"error": "Invalid JSON data"}), 400
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return jsonify({"error": "An unexpected error occurred"}), 500

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


@app.route('/')
@handle_errors
def dashboard():
    return render_template('dashboard.html')


@app.route('/create_proposal', methods=['POST'])
def create_proposal():
    try:
        data = request.get_json()
        proposal_id = str(uuid.uuid4())
        customer_id = data.get('customer_id')

        # Convert numeric strings to floats explicitly
        total = float(data.get('total', '0').replace('$', '').strip())
        tax = float(data.get('tax', '0').replace('$', '').strip())
        subtotal = total - tax  # Calculate subtotal from total and tax

        proposals = load_proposals()
        proposals[proposal_id] = {
            "customer_id": customer_id,
            "height": data['height'],
            "style": data['style'],
            "gates": data['gates'],
            "totalLinearFeet": data['totalLinearFeet'],
            "cornerPosts": data['cornerPosts'],
            "endPosts": data['endPosts'],
            "linePosts": data['linePosts'],
            "materialCost": float(str(data['materialCost']).replace('$', '').strip()),
            "laborCost": float(str(data['laborCost']).replace('$', '').strip()),
            "subtotal": subtotal,
            "tax": tax,
            "total": total,
            "drawing": data['drawing']
        }
        save_proposals(proposals)
        return jsonify({"proposal_id": proposal_id})
    except Exception as e:
        logger.error(f"Error creating proposal: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/proposal/<proposal_id>')
def view_proposal(proposal_id):
    try:
        proposals = load_proposals()

        proposal_data = proposals.get(proposal_id)
        if not proposal_data:
            logger.error(f"Proposal {proposal_id} not found")
            return "Proposal not found", 404

        # Convert string values to float and clean up any currency symbols
        try:
            total = float(str(proposal_data.get('total', '0')).replace('$', '').strip())
            tax = float(str(proposal_data.get('tax', '0')).replace('$', '').strip())

            # Update the proposal data with cleaned numeric values
            proposal_data.update({
                'total': total,
                'tax': tax,
                'subtotal': total - tax,
                'materialCost': float(str(proposal_data.get('materialCost', '0')).replace('$', '').strip()),
                'laborCost': float(str(proposal_data.get('laborCost', '0')).replace('$', '').strip())
            })
        except ValueError as e:
            logger.error(f"Error converting numeric values: {e}")
            # Provide default values if conversion fails
            proposal_data.update({
                'total': 0.0,
                'tax': 0.0,
                'subtotal': 0.0,
                'materialCost': 0.0,
                'laborCost': 0.0
            })

        customer = {}
        customer_id = proposal_data.get('customer_id')
        if customer_id:
            customers = load_customers()
            customer = customers.get(customer_id, {})
            logger.info(f"Loaded customer data for ID {customer_id}: {customer}")

        company_info = load_company_info()

        return render_template('proposal1.html',
                               proposal=proposal_data,
                               customer=customer,
                               company=company_info)
    except Exception as e:
        logger.error(f"Error viewing proposal: {e}")
        return f"Error loading proposal: {str(e)}", 500


@app.route('/pricing')
@handle_errors
def pricing():
    files = [f for f in os.listdir(PRICING_DIR) if f.endswith('.json')]
    return render_template('pricing.html', files=files)


@app.route('/data/<filename>')
@handle_errors
def get_data(filename: str):
    return jsonify(load_json_file(filename))


@app.route('/save/<filename>', methods=['POST'])
@handle_errors
def save_data(filename: str):
    data = request.json
    save_json_file(filename, data)
    return jsonify({"status": "success"})


@app.route('/materials/<filename>')
@handle_errors
def get_material_file(filename: str):
    return send_from_directory(PRICING_DIR, filename)


@app.route("/drawingtool")
def drawing_tool():
    return render_template("drawingtool.html")


@app.route("/wood_fence")
def wood_fence():
    return render_template("wood_fence.html")


@app.route("/chainlink_fence")
def chain_link_fence():
    return render_template("chainlink_fence.html")


@app.route('/api/templates', methods=['GET'])
def get_templates():
    try:
        if not TEMPLATE_FILE.exists():
            init_template_file()
            return jsonify({})

        templates = json.loads(TEMPLATE_FILE.read_text())
        return jsonify(templates)
    except Exception as e:
        logger.error(f"Error loading templates: {e}")
        return jsonify({}), 500


@app.route('/api/templates', methods=['POST'])
def save_template():
    try:
        template_data = request.json
        if not template_data or 'name' not in template_data:
            logger.error("Invalid template data received")
            return jsonify({"error": "Invalid template data"}), 400

        if not TEMPLATE_FILE.exists():
            init_template_file()

        templates = json.loads(TEMPLATE_FILE.read_text())
        templates[template_data['name']] = template_data['data']
        TEMPLATE_FILE.write_text(json.dumps(templates, indent=2))

        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error saving template: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/templates/<name>', methods=['DELETE'])
def delete_template(name):
    try:
        if not TEMPLATE_FILE.exists():
            return jsonify({"success": False, "error": "No templates found"}), 404

        templates = json.loads(TEMPLATE_FILE.read_text())

        if name in templates:
            del templates[name]
            TEMPLATE_FILE.write_text(json.dumps(templates, indent=2))
            return jsonify({"success": True})

        return jsonify({"success": False, "error": "Template not found"}), 404
    except Exception as e:
        logger.error(f"Error deleting template: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)


@app.route('/api/customers')
def get_customers():
    """Get all customers"""
    customers = load_customers()
    return jsonify(customers)


@app.route('/customer_list')
def customer_list():
    """Render the customer list page"""
    return render_template('customer_list.html')


@app.route('/customer_proposals/<customer_id>')
def customer_proposals(customer_id):
    """View proposals for a specific customer"""
    proposals = load_proposals()
    customer_proposals = {
        pid: prop for pid, prop in proposals.items()
        if prop.get('customer_id') == customer_id
    }

    customers = load_customers()
    customer = customers.get(customer_id)

    if not customer:
        return "Customer not found", 404

    return render_template(
        'customer_proposals.html',
        proposals=customer_proposals,
        customer=customer
    )


@app.route('/customer_data')
def customer_data():
    return render_template('customer_data.html')


@app.route('/submit_customer_data', methods=['POST'])
def submit_customer_data():
    data = request.get_json()
    customer_id = str(uuid.uuid4())

    customers = load_customers()
    customers[customer_id] = {
        "name": data['name'],
        "address": data['address'],
        "phone": data['phone'],
        "email": data['email']
    }
    save_customers(customers)

    return jsonify({"success": True, "customer_id": customer_id})


proposals = load_proposals()
init_template_file()

if __name__ == "__main__":
    app.run(debug=True, port=5000)