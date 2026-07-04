from setuptools import setup, find_packages

setup(
    name="ssgzone-mail-sdk",
    version="1.0.0",
    description="Official Python SDK for SSGzone Mail Platform",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.0"
    ],
    python_requires=">=3.7",
    author="SSGzone Team",
    author_email="support@ssgzone.in",
    url="https://github.com/ssgzone/python-sdk",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)