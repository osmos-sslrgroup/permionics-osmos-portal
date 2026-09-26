import sys
from docx import Document
from docx.shared import Inches

def main():
    if len(sys.argv) < 9:
        print("Usage: formatter.py <input_docx> <logo_path> <proj_name> <date> <company> <designed_by> <element_model> <output_docx>")
        sys.exit(1)

    input_docx = sys.argv[1]
    logo_path = sys.argv[2]
    proj_name = sys.argv[3]
    date_val = sys.argv[4]
    company = sys.argv[5]
    designed_by = sys.argv[6]
    element_model = sys.argv[7]
    output_docx = sys.argv[8]

    try:
        doc = Document(input_docx)
    except Exception as e:
        print(f"Error reading docx: {e}")
        sys.exit(1)

    # Dictionary of replacements
    replacements = {
        "Project Name:": proj_name,
        "Date:": date_val,
        "Company:": company,
        "Designed By:": designed_by,
        "Element Model": element_model,
        "Elements Model": element_model
    }

    # 1. Replace text in tables
    for table in doc.tables:
        for row in table.rows:
            for i, cell in enumerate(row.cells):
                text = cell.text.strip()
                # Remove "Change Your Design"
                if "Change Your Design" in text:
                    cell.text = text.replace("Change Your Design", "")
                
                # Check for our labels
                for label, new_value in replacements.items():
                    if label in text:
                        # Sometimes the value is in the same cell: "Project Name: Old Value"
                        # Sometimes it's in the next cell. 
                        # Let's check if the label is the entire cell or if it has the value appended
                        if len(text) > len(label) + 2:
                            # The value is probably in the same cell
                            # E.g., cell.text = "Project Name: OldProject"
                            # We can replace the whole cell text with the label + new value
                            # But wait, python-docx loses formatting if we do cell.text = ...
                            # Let's just do a naive replace for now
                            pass # We'll handle this in the paragraph loop
                        else:
                            # The value is in the next cell
                            if i + 1 < len(row.cells):
                                # Replace the next cell's text
                                if new_value: # Only replace if provided
                                    row.cells[i+1].text = new_value

    # 2. Replace text in paragraphs (for "Change Your Design" and same-cell labels)
    for p in doc.paragraphs:
        if "Change Your Design" in p.text:
            p.text = p.text.replace("Change Your Design", "")
            
        for label, new_value in replacements.items():
            if label in p.text and new_value:
                # If label is in the paragraph, and it's not a table split (meaning it's like "Project Name: OldVal")
                # We can replace the text after the label
                # This is a bit tricky, let's just replace the whole paragraph text if it starts with the label
                if p.text.strip().startswith(label):
                    p.text = f"{label} {new_value}"

    # 3. Replace Header Logo
    if logo_path and logo_path != "dummy_logo":
        try:
            # We add logo to the first section header
            header = doc.sections[0].header
            # Clear existing paragraphs (this removes old text/logos in the header)
            for p in header.paragraphs:
                p.clear()
            
            if len(header.paragraphs) == 0:
                header.add_paragraph()
                
            run = header.paragraphs[0].add_run()
            run.add_picture(logo_path, width=Inches(1.5))
        except Exception as e:
            print(f"Failed to add logo: {e}")

    doc.save(output_docx)
    print("SUCCESS")

if __name__ == "__main__":
    main()
